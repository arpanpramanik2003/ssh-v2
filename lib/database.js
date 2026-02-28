import { Sequelize } from 'sequelize';
import path from 'path';
// Direct import so Vercel's file tracer includes pg in the serverless bundle.
// Without this, Sequelize's dynamic require('pg') is invisible to the tracer.
import pg from 'pg';

// Use globalThis to persist DB across Next.js hot-reloads in dev
// In production (Vercel), each cold start gets its own instance
const g = globalThis;

const createSequelize = () => {
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectModule: pg,  // Pass pg directly — bypasses Sequelize's dynamic require
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      logging: false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    });
  } else {
    const dbPath = path.join(process.cwd(), process.env.DB_NAME || 'smart_student_hub.db');
    return new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: false,
    });
  }
};

export const initDB = async () => {
  // Return existing initialized DB if available
  if (g.__db_initialized && g.__db_User && g.__db_Activity) {
    return { sequelize: g.__db_sequelize, User: g.__db_User, Activity: g.__db_Activity };
  }

  if (!g.__db_sequelize) {
    g.__db_sequelize = createSequelize();
  }

  const sq = g.__db_sequelize;

  const { default: UserModel } = await import('./models/User.js');
  const { default: ActivityModel } = await import('./models/Activity.js');

  // Only define models once on this Sequelize instance
  g.__db_User = g.__db_User || UserModel(sq);
  g.__db_Activity = g.__db_Activity || ActivityModel(sq);

  const User = g.__db_User;
  const Activity = g.__db_Activity;

  // Set up associations (safe to call multiple times - Sequelize handles duplicates)
  if (!g.__db_associations_set) {
    User.hasMany(Activity, { foreignKey: 'studentId', as: 'activities' });
    Activity.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
    Activity.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
    g.__db_associations_set = true;
  }

  if (!g.__db_initialized) {
    try {
      await sq.authenticate();
      const isSQLite = sq.getDialect() === 'sqlite';

      if (isSQLite) {
        // Disable FK checks during ALTER so SQLite doesn't reject column changes
        await sq.query('PRAGMA foreign_keys = OFF;');
      }
      try {
        await User.sync({ alter: true });
        await Activity.sync({ alter: true });
      } catch (alterError) {
        // alter: true can fail on existing DBs with FK constraints — fall back to no-op sync
        console.warn('DB alter failed, falling back to sync without alter:', alterError.message);
        await User.sync();
        await Activity.sync();
      } finally {
        if (isSQLite) {
          await sq.query('PRAGMA foreign_keys = ON;');
        }
      }
      g.__db_initialized = true;
    } catch (error) {
      console.error('DB sync error:', error.message);
      // Mark as initialized anyway so we don't retry on every request
      g.__db_initialized = true;
    }
  }

  return { sequelize: sq, User, Activity };
};

export const getModels = () => ({
  User: g.__db_User,
  Activity: g.__db_Activity,
  sequelize: g.__db_sequelize,
});
