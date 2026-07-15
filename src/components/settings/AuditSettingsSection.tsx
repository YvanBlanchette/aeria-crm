type AuditSettingsSectionProps = {
  auditLogs: Array<{
    id: string;
    summary: string;
    action: string;
    target: string | null;
    createdAt: Date;
    actorUser: { name: string | null; email: string | null } | null;
  }>;
};

export default function AuditSettingsSection({ auditLogs }: AuditSettingsSectionProps) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold text-navy mb-2">Journal d&apos;audit</h2>
      <p className="text-sm text-slate-500 mb-4">
        Historique des opérations sensibles et administratives.
      </p>
      {auditLogs.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune entrée d&apos;audit pour le moment.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {auditLogs.map((log) => (
            <li key={log.id} className="py-3 text-sm">
              <p className="font-medium text-navy">{log.summary}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(log.createdAt).toLocaleString("fr-CA")} ·{" "}
                {log.actorUser?.name ?? log.actorUser?.email ?? "Utilisateur supprimé"}
                {log.target ? ` · ${log.target}` : ""}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Action: {log.action}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
