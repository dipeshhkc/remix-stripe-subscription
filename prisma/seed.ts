import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
import { add } from "date-fns";


async function seed() {
  await Promise.all(
    getUsers().map((user) => {
      return db.user.create({ data: user });
    })
  );
}

seed();

function getUsers() {
  return [
    {
      email: 'user1@gmail.com',
      trial_ends_at: add(new Date(), { weeks: 1 }),
    },
    {
      email: 'user2@gmail.com',
      trial_ends_at: add(new Date(), { weeks: 1 }),
    },
  ];
}
