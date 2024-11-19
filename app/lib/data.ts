import Customer from '@/app/models/Customer';
import Invoice from '@/app/models/Invoice';
import User from '@/app/models/User';
import Revenue from '@/app/models/Revenue';
import dbConnect from '@/app/lib/dbConnect';
import { formatCurrency } from './utils';

export async function fetchRevenue() {
  try {
    await dbConnect()
    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const data = await Revenue.find({});
    console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    await dbConnect();

    // Fetch the latest invoices
    const invoices = await Invoice.find({})
      .sort({ date: -1 })
      .limit(5);
    // Fetch customer details manually for each invoice
    const latestInvoices = await Promise.all(
      invoices.map(async (invoice: any) => {
        const customer = await Customer.findOne({ id: invoice.customer_id })
          .select('name image_url email');

        return {
          id: invoice._id,
          name: customer ? customer.name : 'Unknown', // Fallback in case customer is not found
          image_url: customer ? customer.image_url : '', // Fallback
          email: customer ? customer.email : '', // Fallback
          amount: formatCurrency(invoice.amount),
        };
      })
    );

    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}




export async function fetchCardData() {
  try {
    
    await dbConnect()
    const [numberOfInvoices, numberOfCustomers, invoiceStatus] = await Promise.all([
      Invoice.countDocuments(),
      Customer.countDocuments(),
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          },
        },
      ]),
    ]);

    const totalPaidInvoices = formatCurrency(invoiceStatus[0]?.paid ?? 0);
    const totalPendingInvoices = formatCurrency(invoiceStatus[0]?.pending ?? 0);

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}


const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // Connect to the database
    await dbConnect();

    // Construct the query conditions
    const conditions = [
      { status: { $regex: query, $options: 'i' } }, // Search based on status
    ];

    // Add number comparison for `amount` if `query` is numeric
    if (/^[0-9]+$/.test(query)) {
      conditions.push({ amount: parseFloat(query) });
    }

    // Add date comparison if `query` can be parsed into a valid date
    if (!isNaN(Date.parse(query))) {
      conditions.push({ date: new Date(query) });
    }

    // Filter out any undefined conditions
    const queryConditions = { $or: conditions.filter(Boolean) };

    // Fetch invoices with custom population (reference by `id`)
    const invoices = await Invoice.find(queryConditions)
      .sort({ date: -1 })
      .skip(offset)
      .limit(ITEMS_PER_PAGE)
      .populate('customer_id'); // Populate the customer details

    console.log(invoices);
    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}


export async function fetchInvoicesPages(query: string) {
  try {
    await dbConnect()
    const count = await Invoice.countDocuments();

    const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}


export async function fetchInvoiceById(id: string) {
  try {
    
    await dbConnect()
    const invoice: any = await Invoice.findOne({ id }).lean();

    if (invoice) {
      invoice.amount = invoice.amount / 100; // Convert from cents to dollars
    }

    return invoice;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    
    await dbConnect()
    const customers = await Customer.find({}).select('id name').sort({ name: 1 });
    return customers;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    
    await dbConnect()
    const customers = await Customer.aggregate([
      {
        $lookup: {
          from: 'invoices',
          localField: 'id',
          foreignField: 'customer_id',
          as: 'invoices',
        },
      },
      {
        $match: {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        },
      },
      {
        $project: {
          id: 1,
          name: 1,
          email: 1,
          image_url: 1,
          total_invoices: { $size: '$invoices' },
          total_pending: {
            $sum: {
              $map: {
                input: '$invoices',
                as: 'invoice',
                in: { $cond: [{ $eq: ['$$invoice.status', 'pending'] }, '$$invoice.amount', 0] },
              },
            },
          },
          total_paid: {
            $sum: {
              $map: {
                input: '$invoices',
                as: 'invoice',
                in: { $cond: [{ $eq: ['$$invoice.status', 'paid'] }, '$$invoice.amount', 0] },
              },
            },
          },
        },
      },
      { $sort: { name: 1 } },
    ]);

    return customers.map((customer: any) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customer table.');
  }
}
