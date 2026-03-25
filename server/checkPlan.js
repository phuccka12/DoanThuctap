const mongoose = require('mongoose');
require('dotenv').config();

// Define models directly to avoid path issues or complex imports
const dayItemSchema = new mongoose.Schema({
    dayIndex: Number,
    itemId: mongoose.Schema.Types.ObjectId,
    itemType: String,
    status: String,
    tasks: [{
        type: { type: String },
        name: String,
        itemId: mongoose.Schema.Types.ObjectId,
        status: String
    }]
});
const UserPlan = mongoose.model('UserPlan', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    dayItems: [dayItemSchema],
    status: String
}, { timestamps: true }), 'userplans');

async function run() {
    try {
        console.log('Connecting to MONGO_URI...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const plan = await UserPlan.findOne({ status: 'active' }).sort({ updatedAt: -1 }).lean();
        if (!plan) {
            console.log('No active plan found.');
            process.exit(0);
        }

        let out = '\n--- ACTIVE PLAN DIAGNOSTIC ---\n';
        out += `User ID: ${plan.userId}\n`;
        out += `Plan ID: ${plan._id}\n`;
        out += `Updated At: ${plan.updatedAt}\n\n`;

        plan.dayItems.forEach((day, idx) => {
            const isToday = idx === 2; // Wednesday
            const prefix = isToday ? '>>> TODAY <<<' : `Day ${idx}`;
            out += `${prefix} (Thứ ${idx+2}): status=${day.status}\n`;
            
            if (day.tasks && day.tasks.length > 0) {
                day.tasks.forEach(t => {
                    out += `  [Task] ${t.name} (${t.type}) status=${t.status} itemId=${t.itemId}\n`;
                });
            } else if (day.itemId) {
                out += `  [Main] Type=${day.itemType} itemId=${day.itemId}\n`;
            }
        });

        require('fs').writeFileSync('plan_result.txt', out, 'utf8');
        console.log('Result written to plan_result.txt');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
