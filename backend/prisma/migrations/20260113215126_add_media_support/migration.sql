-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "integrationId" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "mediaFilename" TEXT,
ADD COLUMN     "mediaMimeType" TEXT,
ADD COLUMN     "mediaSize" INTEGER,
ADD COLUMN     "mediaType" TEXT,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT;

-- CreateTable
CREATE TABLE "ContactList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KanbanColumn" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#cbd5e1',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KanbanColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KanbanCard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" DOUBLE PRECISION,
    "order" INTEGER NOT NULL,
    "columnId" TEXT NOT NULL,
    "contactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KanbanCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContactToContactList" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ContactToContactList_AB_unique" ON "_ContactToContactList"("A", "B");

-- CreateIndex
CREATE INDEX "_ContactToContactList_B_index" ON "_ContactToContactList"("B");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactList" ADD CONSTRAINT "ContactList_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanColumn" ADD CONSTRAINT "KanbanColumn_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanCard" ADD CONSTRAINT "KanbanCard_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "KanbanColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanCard" ADD CONSTRAINT "KanbanCard_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToContactList" ADD CONSTRAINT "_ContactToContactList_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToContactList" ADD CONSTRAINT "_ContactToContactList_B_fkey" FOREIGN KEY ("B") REFERENCES "ContactList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
