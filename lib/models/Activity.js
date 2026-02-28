import { DataTypes } from 'sequelize';

export default function ActivityModel(sequelize) {
  const Activity = sequelize.define(
    'Activity',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      title: { type: DataTypes.STRING, allowNull: false },
      type: {
        type: DataTypes.ENUM(
          'conference',
          'workshop',
          'certification',
          'competition',
          'internship',
          'leadership',
          'community_service',
          'club_activity',
          'online_course'
        ),
        allowNull: false,
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      date: { type: DataTypes.DATE, allowNull: false },
      duration: { type: DataTypes.STRING, allowNull: true },
      organizer: { type: DataTypes.STRING, allowNull: true },
      filePath: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      credits: { type: DataTypes.DECIMAL(3, 1), defaultValue: 0 },
    },
    {
      timestamps: true,
      tableName: 'activities',
    }
  );

  return Activity;
}
