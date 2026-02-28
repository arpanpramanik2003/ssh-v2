import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export default function UserModel(sequelize) {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: { type: DataTypes.STRING, allowNull: false },
      role: {
        type: DataTypes.ENUM('student', 'faculty', 'admin'),
        allowNull: false,
        defaultValue: 'student',
      },
      department: { type: DataTypes.STRING, allowNull: true },
      programCategory: { type: DataTypes.STRING, allowNull: true },
      program: { type: DataTypes.STRING, allowNull: true },
      specialization: { type: DataTypes.STRING, allowNull: true },
      year: { type: DataTypes.INTEGER, allowNull: true },
      admissionYear: { type: DataTypes.INTEGER, allowNull: true },
      studentId: { type: DataTypes.STRING, allowNull: true, unique: true },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      profilePicture: { type: DataTypes.STRING, allowNull: true },
      tenthResult: { type: DataTypes.STRING, allowNull: true },
      twelfthResult: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      languages: { type: DataTypes.STRING, allowNull: true },
      skills: { type: DataTypes.STRING, allowNull: true },
      otherDetails: { type: DataTypes.TEXT, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
      gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: true },
      category: { type: DataTypes.ENUM('General', 'OBC', 'SC', 'ST'), allowNull: true },
      hobbies: { type: DataTypes.STRING, allowNull: true },
      achievements: { type: DataTypes.TEXT, allowNull: true },
      projects: { type: DataTypes.TEXT, allowNull: true },
      certifications: { type: DataTypes.TEXT, allowNull: true },
      linkedinUrl: { type: DataTypes.STRING, allowNull: true },
      githubUrl: { type: DataTypes.STRING, allowNull: true },
      portfolioUrl: { type: DataTypes.STRING, allowNull: true },
    },
    {
      timestamps: true,
      tableName: 'users',
    }
  );

  User.beforeCreate(async (user) => {
    if (user.password) user.password = await bcrypt.hash(user.password, 12);
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12);
  });

  User.prototype.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  return User;
}
