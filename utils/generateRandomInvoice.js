function generateRandomInvoice(prefix = 'INV') {
    // Get the current timestamp
    const timestamp = Date.now();

    // Generate a random number between 1000 and 9999
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    // Combine the prefix, timestamp, and random number to create the invoice number
    const invoiceNumber = `${prefix}-${timestamp}-${randomNum}`;

    return invoiceNumber;
}

module.exports = { generateRandomInvoice }