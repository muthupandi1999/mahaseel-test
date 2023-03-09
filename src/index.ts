import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import oracledb from "oracledb";

import cors from 'cors'

async function startApolloServer() {

    const port = 3000;
  
    const app = express();

    app.use(cors())

    const config: oracledb.PoolAttributes = {
        user: 'SYSTEM',
        password: 'root123',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=CIPL1117UI)(PORT=1522))(CONNECT_DATA=(SERVER=DEDICATED)(SID=xe)))',
        poolMax: 4,
        poolMin: 0,
        poolIncrement: 1,
    };

    const pool = await oracledb.createPool(config);

    const typeDefs = `
        type User {
          id: Int!
          name: String!
          email: String!
        }
    
        input UserInput {
          name: String!
          email: String!
        }
    
        type Query {
          greeting:String
          employees: [User!]!
          getUser(id: Int!): User
          getUsers: [User]
        }
    
        type Mutation {
          createUser(input: UserInput): User
          updateUser(id: Int!, input: UserInput): User
          deleteUser(id: Int!): User
        }`;

    const resolvers = {
        Query: {
            greeting: () => "hello",
           
            getUser: async (_, { id }) => {
                const connection = await pool.getConnection();
                const result = await connection.execute(
                    `SELECT * FROM employees WHERE id = :id`,
                    [id]
                );
                const user = await result.rows[0];

                console.log("user", user);

                await connection.close();

                return await user;
            },
            getUsers: async () => {

                const connection = await pool.getConnection();
                const result = await connection.execute(`SELECT * FROM employees`);
                console.log(result.rows);
                const users = await result.rows;
                await connection.close();
                return users;

                // const connection = await pool.getConnection();

                // const result = await connection.execute(`SELECT * FROM employees WHERE id = 61`);

                // console.log("result", result);
                // let convertedArr = result.rows.flat();
                // let num = 51;
                // await convertedArr.forEach(ele => ele === num, (async(err, result) => {
                //     console.log("1")
                //     if(result){
                //         await connection.execute(`SELECT * FROM employees WHERE id = :result`, [result], ((err, result) => {
                //             if(result){
                //                 console.log("result", result);
                //                 return result;
                //             }
                //         }));
                //     }
                // }))
                // console.log(convertedArr)
                // const users = await result.rows;
                // await connection.close();
                // return users;
        
        


            },
        },
        Mutation: {
            createUser: async (_, { input }) => {

                const connection = await pool.getConnection();

                console.log("hloooo");

                // const result = await connection.execute(`INSERT INTO employees VALUES (
                //     '{ "name": ":name", "email": ":email"}');
                // COMMIT;`)

                const result = await connection.execute(`INSERT INTO employees( name, email) VALUES (:name, :email)`, [input.name, input.email] || {}, {autoCommit:true});

                console.log(result)

                const user = await result;

                await connection.close();

                return user;

                // return user;
            },
            updateUser: async (_, { id, input }) => {
                const connection = await pool.getConnection();
                const result = await connection.execute(
                    `UPDATE employees SET name = :name, email = :email WHERE id = :id`,
                    [input.name, input.email, id], {autoCommit:true}
                );
                const user = result.rows[0];
                await connection.close();
                return user;
            },
            deleteUser: async (_, { id }) => {
                const connection = await pool.getConnection();
                const result = await connection.execute(
                    `DELETE FROM employees WHERE id = :id `,
                    [id], {autoCommit:true}
                );
                console.log(result)
                const user = result.rows[0];
                await connection.close();
                return user;
            },
        },
    };

    const server = new ApolloServer({ typeDefs, resolvers });

    await server.start();

    

    server.applyMiddleware({ app });

    app.listen(3000, () =>
        console.log(
            'Server ready at http://localhost:3000/graphql'
        )
    );

}

startApolloServer()

