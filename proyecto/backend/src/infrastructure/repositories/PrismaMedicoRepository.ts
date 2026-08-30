import { PrismaClient } from "@prisma/client";
import { Medico } from "../../domain/entities/Medico.js";
import { MedicoRepository } from "../../domain/repositories/MedicoRepository.js";

export class PrismaMedicoRepository implements MedicoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async guardar(medico: Medico): Promise<void> {
    await this.prisma.medico.upsert({
      where: { id: medico.getId() },
      create: {
        id: medico.getId(),
        nombre: medico.getNombre(),
        especialidad: medico.getEspecialidad(),
      },
      update: {
        nombre: medico.getNombre(),
        especialidad: medico.getEspecialidad(),
      },
    });
  }

  async buscarPorId(id: string): Promise<Medico | null> {
    const registro = await this.prisma.medico.findUnique({ where: { id } });
    return registro ? this.aDominio(registro) : null;
  }

  async listar(): Promise<Medico[]> {
    const registros = await this.prisma.medico.findMany();
    return registros.map((r) => this.aDominio(r));
  }

  private aDominio(registro: { id: string; nombre: string; especialidad: string }): Medico {
    return Medico.crear({
      id: registro.id,
      nombre: registro.nombre,
      especialidad: registro.especialidad,
    });
  }
}