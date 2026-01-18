import { db } from '../src/server/db/connection.js';
import { users } from '../src/server/db/schema.js';
import { eq } from 'drizzle-orm';

async function manageAdmin() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node dist/scripts/manage-admin.js <add|remove> <email>');
        process.exit(1);
    }

    const [action, email] = args;
    const isAdmin = action === 'add';

    if (action !== 'add' && action !== 'remove') {
        console.error('Invalid action. Use "add" or "remove".');
        process.exit(1);
    }

    console.log(`${isAdmin ? 'Adding' : 'Removing'} admin status for ${email}...`);

    try {
        const result = await db.update(users)
            .set({ isAdmin })
            .where(eq(users.email, email))
            .returning();

        if (result.length === 0) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        console.log(`Successfully updated ${email}. isAdmin: ${result[0].isAdmin}`);
    } catch (error) {
        console.error('Error updating admin status:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

manageAdmin();
