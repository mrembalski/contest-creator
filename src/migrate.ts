import {ContestCreatorApplication} from './application';

export async function migrate(args: string[]) {
  const existingSchema = args.includes('--rebuild') ? 'drop' : 'alter';
  console.log('Migrating schemas (%s existing schema)', existingSchema);

  const app = new ContestCreatorApplication();
  await app.boot();

  await app.migrateSchema({
    existingSchema,
  });
  // {
  //   existingSchema,
  //   // The order of table creation is important.
  //   // A referenced table must exist before creating a
  //   // foreign key constraint.
  //   // For PostgreSQL connector, it does not create tables in the
  //   // right order.  Therefore, this change is needed.
  //   models: ['User', 'Contest', 'Commission', 'Task', 'Solution', 'Mark', 'Participation'],
  // }
  process.exit(0);
}

migrate(process.argv).catch((err) => {
  console.error('Cannot migrate database schema', err);
  process.exit(1);
});
