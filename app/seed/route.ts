import dbConnect from '../lib/dbConnect';
import User from '../models/User';
import Invoice from '../models/Invoice'
import Customer from '../models/Customer';
import Revenue from '../models/Revenue';
import bcrypt from 'bcrypt';
import { users, invoices, customers, revenue } from '../lib/placeholder-data';

const seedUsers = async () => {
  try {
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await User.updateOne(
        { id: user.id },
        { ...user, password: hashedPassword },
        { upsert: true }
      );
    }
    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

const seedCustomers = async () => {
  try {

    for (const customer of customers) {
      await Customer.updateOne(
        { id: customer.id },
        customer,
        { upsert: true }
      );
    }
    console.log('Customers seeded successfully');
  } catch (error) {
    console.error('Error seeding customers:', error);
  }
};

const seedInvoices = async () => {
  try {

    for (const invoice of invoices) {
      await Invoice.updateOne(
        { id: invoice.id },
        invoice,
        { upsert: true }
      );
    }
    console.log('Invoices seeded successfully');
  } catch (error) {
    console.error('Error seeding invoices:', error);
  }
};

const seedRevenue = async () => {
  try {

    for (const rev of revenue) {
      await Revenue.updateOne(
        { month: rev.month },
        rev,
        { upsert: true }
      );
    }
    console.log('Revenue seeded successfully');
  } catch (error) {
    console.error('Error seeding revenue:', error);
  }
};

const seedDatabase = async () => {
  await dbConnect()

  try {
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    console.log('Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
