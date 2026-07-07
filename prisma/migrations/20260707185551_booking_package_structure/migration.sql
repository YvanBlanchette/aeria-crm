-- CreateEnum
CREATE TYPE "SegmentType" AS ENUM ('CRUISE', 'FLIGHT', 'HOTEL', 'TRANSFER', 'ACTIVITY', 'INSURANCE', 'FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "SegmentStatus" AS ENUM ('DRAFT', 'OPTION', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'VOIDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'INTERIM', 'FINAL', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('INTERNAL', 'CLIENT');

-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('SERVICE_FEE', 'TAX', 'PORT_FEE', 'GRATUITY', 'INSURANCE_PREMIUM', 'EXCURSION', 'ADDON', 'DISCOUNT', 'ADJUSTMENT', 'OTHER');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "clientNotes" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'CAD',
ADD COLUMN     "destinationMain" TEXT,
ADD COLUMN     "globalDepartureDate" TIMESTAMP(3),
ADD COLUMN     "globalReturnDate" TIMESTAMP(3),
ADD COLUMN     "internalFileNumber" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "packageType" TEXT,
ADD COLUMN     "serviceFees" DECIMAL(10,2),
ADD COLUMN     "supplierMain" TEXT,
ADD COLUMN     "totalCommission" DECIMAL(10,2),
ADD COLUMN     "totalNet" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "BookingSegment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "SegmentType" NOT NULL,
    "status" "SegmentStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "supplierName" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "confirmationNumber" TEXT,
    "includedInPackage" BOOLEAN NOT NULL DEFAULT true,
    "optionalForClient" BOOLEAN NOT NULL DEFAULT false,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "currency" TEXT,
    "baseAmount" DECIMAL(10,2),
    "taxesAmount" DECIMAL(10,2),
    "feesAmount" DECIMAL(10,2),
    "totalAmount" DECIMAL(10,2),
    "internalNotes" TEXT,
    "clientNotes" TEXT,
    "extra" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CruiseSegment" (
    "segmentId" TEXT NOT NULL,
    "cruiseLine" TEXT,
    "shipName" TEXT,
    "itineraryName" TEXT,
    "portsOfCall" JSONB,
    "embarkationPort" TEXT,
    "disembarkationPort" TEXT,
    "cabinCategory" TEXT,
    "cabinNumber" TEXT,
    "deck" TEXT,
    "occupancy" INTEGER,
    "cruiseBookingNumber" TEXT,
    "wholesalerSupplier" TEXT,
    "beveragePackage" BOOLEAN NOT NULL DEFAULT false,
    "wifiPackage" BOOLEAN NOT NULL DEFAULT false,
    "specialtyDining" BOOLEAN NOT NULL DEFAULT false,
    "onboardCredit" DECIMAL(10,2),
    "excursionCredit" DECIMAL(10,2),
    "prepaidGratuities" DECIMAL(10,2),
    "portTaxesFees" DECIMAL(10,2),
    "otherInclusions" TEXT,

    CONSTRAINT "CruiseSegment_pkey" PRIMARY KEY ("segmentId")
);

-- CreateTable
CREATE TABLE "FlightSegment" (
    "segmentId" TEXT NOT NULL,
    "airlineName" TEXT,
    "cabinClass" TEXT,
    "baggageIncluded" TEXT,
    "seatSelection" TEXT,
    "pnr" TEXT,
    "notes" TEXT,

    CONSTRAINT "FlightSegment_pkey" PRIMARY KEY ("segmentId")
);

-- CreateTable
CREATE TABLE "FlightLeg" (
    "id" TEXT NOT NULL,
    "flightSegmentId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "flightNumber" TEXT,
    "departureAirport" TEXT,
    "arrivalAirport" TEXT,
    "departureAt" TIMESTAMP(3),
    "arrivalAt" TIMESTAMP(3),
    "stopoverNotes" TEXT,

    CONSTRAINT "FlightLeg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelSegment" (
    "segmentId" TEXT NOT NULL,
    "hotelName" TEXT,
    "address" TEXT,
    "city" TEXT,
    "checkInDate" TIMESTAMP(3),
    "checkOutDate" TIMESTAMP(3),
    "roomType" TEXT,
    "occupancy" INTEGER,
    "mealPlan" TEXT,
    "confirmationNumber" TEXT,
    "resortFeesTaxes" DECIMAL(10,2),
    "notes" TEXT,

    CONSTRAINT "HotelSegment_pkey" PRIMARY KEY ("segmentId")
);

-- CreateTable
CREATE TABLE "TransferSegment" (
    "segmentId" TEXT NOT NULL,
    "transferType" TEXT,
    "provider" TEXT,
    "transferDate" TIMESTAMP(3),
    "transferTime" TEXT,
    "pickupLocation" TEXT,
    "dropoffLocation" TEXT,
    "confirmationNumber" TEXT,
    "includedInPackage" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "TransferSegment_pkey" PRIMARY KEY ("segmentId")
);

-- CreateTable
CREATE TABLE "ActivitySegment" (
    "segmentId" TEXT NOT NULL,
    "activityName" TEXT,
    "provider" TEXT,
    "activityDate" TIMESTAMP(3),
    "activityTime" TEXT,
    "departureLocation" TEXT,
    "duration" TEXT,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "confirmationNumber" TEXT,
    "notes" TEXT,

    CONSTRAINT "ActivitySegment_pkey" PRIMARY KEY ("segmentId")
);

-- CreateTable
CREATE TABLE "InsuranceSegment" (
    "segmentId" TEXT NOT NULL,
    "provider" TEXT,
    "coverageType" TEXT,
    "policyNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "coveredAmount" DECIMAL(10,2),
    "premium" DECIMAL(10,2),
    "notes" TEXT,

    CONSTRAINT "InsuranceSegment_pkey" PRIMARY KEY ("segmentId")
);

-- CreateTable
CREATE TABLE "BookingPayment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "method" "PaymentMethod",
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "PaymentType" NOT NULL DEFAULT 'INTERIM',
    "isFinalPayment" BOOLEAN NOT NULL DEFAULT false,
    "finalDueDate" TIMESTAMP(3),
    "externalReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPaymentSchedule" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "label" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingPaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "segmentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingCharge" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "segmentId" TEXT,
    "type" "ChargeType" NOT NULL DEFAULT 'OTHER',
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "includedInTotal" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingCommission" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "segmentId" TEXT,
    "supplier" TEXT,
    "ratePercent" DECIMAL(5,2),
    "amount" DECIMAL(10,2),
    "currency" TEXT,
    "payableOn" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingDocument" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "segmentId" TEXT,
    "paymentId" TEXT,
    "uploadedById" TEXT,
    "documentType" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "storageKey" TEXT,
    "fileUrl" TEXT,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingSegment_bookingId_sortOrder_idx" ON "BookingSegment"("bookingId", "sortOrder");

-- CreateIndex
CREATE INDEX "BookingSegment_type_status_idx" ON "BookingSegment"("type", "status");

-- CreateIndex
CREATE INDEX "FlightLeg_flightSegmentId_sortOrder_idx" ON "FlightLeg"("flightSegmentId", "sortOrder");

-- CreateIndex
CREATE INDEX "BookingPayment_bookingId_status_paidAt_idx" ON "BookingPayment"("bookingId", "status", "paidAt");

-- CreateIndex
CREATE INDEX "BookingPaymentSchedule_bookingId_dueDate_idx" ON "BookingPaymentSchedule"("bookingId", "dueDate");

-- CreateIndex
CREATE INDEX "BookingPaymentSchedule_status_dueDate_idx" ON "BookingPaymentSchedule"("status", "dueDate");

-- CreateIndex
CREATE INDEX "BookingPaymentAllocation_paymentId_idx" ON "BookingPaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "BookingPaymentAllocation_segmentId_idx" ON "BookingPaymentAllocation"("segmentId");

-- CreateIndex
CREATE INDEX "BookingCharge_bookingId_type_idx" ON "BookingCharge"("bookingId", "type");

-- CreateIndex
CREATE INDEX "BookingCharge_segmentId_idx" ON "BookingCharge"("segmentId");

-- CreateIndex
CREATE INDEX "BookingCommission_bookingId_payableOn_idx" ON "BookingCommission"("bookingId", "payableOn");

-- CreateIndex
CREATE INDEX "BookingCommission_segmentId_idx" ON "BookingCommission"("segmentId");

-- CreateIndex
CREATE INDEX "BookingDocument_bookingId_createdAt_idx" ON "BookingDocument"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingDocument_segmentId_idx" ON "BookingDocument"("segmentId");

-- CreateIndex
CREATE INDEX "BookingDocument_paymentId_idx" ON "BookingDocument"("paymentId");

-- CreateIndex
CREATE INDEX "Booking_clientId_status_sailingDate_idx" ON "Booking"("clientId", "status", "sailingDate");

-- CreateIndex
CREATE INDEX "Booking_destinationMain_idx" ON "Booking"("destinationMain");

-- CreateIndex
CREATE INDEX "Booking_internalFileNumber_idx" ON "Booking"("internalFileNumber");

-- AddForeignKey
ALTER TABLE "BookingSegment" ADD CONSTRAINT "BookingSegment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CruiseSegment" ADD CONSTRAINT "CruiseSegment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BookingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightSegment" ADD CONSTRAINT "FlightSegment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BookingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightLeg" ADD CONSTRAINT "FlightLeg_flightSegmentId_fkey" FOREIGN KEY ("flightSegmentId") REFERENCES "FlightSegment"("segmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelSegment" ADD CONSTRAINT "HotelSegment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BookingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferSegment" ADD CONSTRAINT "TransferSegment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BookingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySegment" ADD CONSTRAINT "ActivitySegment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BookingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceSegment" ADD CONSTRAINT "InsuranceSegment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BookingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPayment" ADD CONSTRAINT "BookingPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPaymentSchedule" ADD CONSTRAINT "BookingPaymentSchedule_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPaymentAllocation" ADD CONSTRAINT "BookingPaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "BookingPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPaymentAllocation" ADD CONSTRAINT "BookingPaymentAllocation_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BookingSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCharge" ADD CONSTRAINT "BookingCharge_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCharge" ADD CONSTRAINT "BookingCharge_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BookingSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCommission" ADD CONSTRAINT "BookingCommission_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCommission" ADD CONSTRAINT "BookingCommission_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BookingSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDocument" ADD CONSTRAINT "BookingDocument_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDocument" ADD CONSTRAINT "BookingDocument_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "BookingSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDocument" ADD CONSTRAINT "BookingDocument_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "BookingPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDocument" ADD CONSTRAINT "BookingDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
