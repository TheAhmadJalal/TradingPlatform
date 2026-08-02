// #!/usr/bin/env node
// /**
//  * Creates (or updates) a CRM operator account.
//  *
//  *   node scripts/create-crm-user.js "Ahmad Jalal" ahmad@example.com "S0me-Strong-Pass" admin
//  *
//  * Arguments: name, email, password, role ("admin" | "agent", default "agent").
//  * Re-running with an existing email resets that account's password instead of
//  * failing, which is the easiest way to recover a locked-out operator.
//  */

// require("dotenv").config();
// const mongoose = require("mongoose");
// const CrmUser = require("../models/CrmUser");

// const [, , name, email, password, role = "agent"] = process.argv;

// if (!name || !email || !password) {
//   console.error("Usage: node scripts/create-crm-user.js <name> <email> <password> [admin|agent]");
//   process.exit(1);
// }

// if (password.length < 8) {
//   console.error("❌ Password must be at least 8 characters.");
//   process.exit(1);
// }

// if (!["admin", "agent"].includes(role)) {
//   console.error('❌ Role must be "admin" or "agent".');
//   process.exit(1);
// }

// (async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);

//     const normalised = email.trim().toLowerCase();
//     let user = await CrmUser.findOne({ email: normalised });

//     if (user) {
//       user.name = name;
//       user.password = password; // re-hashed by the pre-save hook
//       user.role = role;
//       user.active = true;
//       await user.save();
//       console.log(`✅ Updated existing CRM user: ${normalised} (${role})`);
//     } else {
//       user = await CrmUser.create({ name, email: normalised, password, role });
//       console.log(`✅ Created CRM user: ${normalised} (${role})`);
//     }

//     await mongoose.disconnect();
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Failed:", err.message);
//     process.exit(1);
//   }
// })();
