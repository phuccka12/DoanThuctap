const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const UserPlan = mongoose.model('UserPlan', new mongoose.Schema({
            userId: mongoose.Schema.Types.ObjectId,
            dayItems: Array,
            status: String
        }), 'userplans');

        const plan = await UserPlan.findById('69c29848e98f2083dae1cd').lean();
        if (!plan) {
            console.log('Plan not found');
            process.exit(0);
        }

        let out = '--- TARGET PLAN DIAGNOSTIC ---\n';
        plan.dayItems.forEach((day, idx) => {
            out += `Day ${idx} (Thứ ${idx+2}): status=${day.status}\n`;
            if (day.tasks) {
                day.tasks.forEach(t => {
                    out += `  [Task] ${t.name} status=${t.status} itemId=${t.itemId}\n`;
                });
            }
            if (day.itemId) {
                out += `  [Main] ItemId=${day.itemId} type=${day.itemType}\n`;
            }
        });
        require('fs').writeFileSync('plan_detail.txt', out, 'utf8');
        console.log('Done');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
