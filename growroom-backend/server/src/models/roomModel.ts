import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/mysql';

class Room extends Model {
  public id!: number;
  public name!: string;
  public lightSetting!: number;
  public humiditySetting!: number;
  public temperatureSetting!: number;
  public irrigationSetting!: number;
}

Room.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lightSetting: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    humiditySetting: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    temperatureSetting: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    irrigationSetting: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'rooms',
  }
);

export default Room;