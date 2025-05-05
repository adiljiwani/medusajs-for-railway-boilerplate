import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm"

export class PackingSlipTable1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "fulfillment_packing_slip",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        isPrimary: true,
                    },
                    {
                        name: "fulfillment_id",
                        type: "varchar",
                        isUnique: true,
                    },
                    {
                        name: "packing_slip_url",
                        type: "varchar",
                    },
                    {
                        name: "generated_at",
                        type: "timestamp with time zone",
                    },
                    {
                        name: "created_at",
                        type: "timestamp with time zone",
                        default: "now()",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp with time zone",
                        default: "now()",
                    },
                ],
            }),
            true
        )

        await queryRunner.createForeignKey(
            "fulfillment_packing_slip",
            new TableForeignKey({
                columnNames: ["fulfillment_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "fulfillment",
                onDelete: "CASCADE",
            })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("fulfillment_packing_slip", true)
    }
} 