const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const PasswordResetToken = sequelize.define(
  "PasswordResetToken",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "tUsers",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    token_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    requested_ip: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requested_user_agent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "tPasswordResetTokens",
    timestamps: false,
  }
);

module.exports = PasswordResetToken;