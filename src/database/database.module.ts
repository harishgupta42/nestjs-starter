import { Connection } from 'mongoose';

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        pass: process.env.DB_PASSWORD,
        dbName: process.env.DB_NAME,
        authSource: process.env.DB_NAME,
        autoIndex: true,
        autoCreate: true,
        connectionFactory: (connection: Connection) => {
          connection.set('debug', true);
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
