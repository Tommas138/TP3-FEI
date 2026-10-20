-- CreateTable
CREATE TABLE "dispositivos_aviso" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dispositivos_aviso_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_aviso_token_key" ON "dispositivos_aviso"("token");
-- CreateIndex
CREATE INDEX "dispositivos_aviso_usuarioId_idx" ON "dispositivos_aviso"("usuarioId");
-- AddForeignKey
ALTER TABLE "dispositivos_aviso" ADD CONSTRAINT "dispositivos_aviso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
