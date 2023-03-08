import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
const { GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList, GraphQLNonNull, GraphQLSchema, } = require('graphql');
import oracledb, { STRING } from "oracledb";

// const connectToDB = require('../src/oracledb');

async function startApolloServer() {
    const port = 4000
    const app = express();

    const connectionParams: oracledb.ConnectionAttributes = {
        user: 'SYSTEM',
        password: 'root123',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=CIPL1117UI)(PORT=1522))(CONNECT_DATA=(SERVER=DEDICATED)(SID=xe)))'
    };

    // const config: oracledb.PoolAttributes = {
    //     user: 'SYSTEM',
    //     password: 'root123',
    //     connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=CIPL1117UI)(PORT=1522))(CONNECT_DATA=(SERVER=DEDICATED)(SID=xe)))',
    //     poolMax: 4,
    //     poolMin: 0,
    //     poolIncrement: 1,
    // };

    const pool = await oracledb.createPool(connectionParams);

    // const connection =  pool.getConnection()

    const UserType = new GraphQLObjectType({
        name: 'User',
        fields: () => ({
            id: { type: GraphQLInt },
            name: { type: GraphQLString },
            email: { type: GraphQLString },
        }),
    });

    const QueryType = new GraphQLObjectType({
        name: 'Query',
        fields: () => ({
            users: {
                type: new GraphQLList(UserType),
                resolve: async (parent, args,) => {
                    const connection = await pool.getConnection();
                    const result = await connection.execute(`SELECT * FROM employees`);
                    console.log(result.rows)
                    const users = await result.rows;

                    await connection.close();

                    return users;
                },
            },
            user: {
                type: UserType,
                args: {
                    id: { type: GraphQLNonNull(GraphQLInt) },
                },
                resolve: async (parent, { id }) => {
                    const connection = await pool.getConnection();
                    const result = await connection.execute('SELECT * FROM employees WHERE id = :id', [id], (err, result) => {
                        if (err) {
                            return err
                        } else {
                            console.log(result.rows[0])
                            console.log("success")
                            return result.rows[0];
                        }
                    });

                },
            },
        }),
    });

    const MutationType = new GraphQLObjectType({
        name: 'Mutation',
        fields: () => ({
            createUser: {
                type: UserType,
                args: {

                    name: { type: GraphQLNonNull(GraphQLString) },
                    email: { type: GraphQLNonNull(GraphQLString) },
                },
                // resolve: async (name: string, email: string) => {
                //     try {
                //         // create a connection pool
                //         const pool = await oracledb.createPool({
                //             user: 'SYSTEM',
                //             password: 'root123',
                //             connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=CIPL1117UI)(PORT=1522))(CONNECT_DATA=(SERVER=DEDICATED)(SID=xe)))'
                //         });

                //         // get a connection from the pool
                //         const connection = await pool.getConnection();

                //         // execute the query to insert the new user
                //         const result = await connection.execute(
                //             `INSERT INTO employees (name, email) VALUES (:name, :email)`,
                //             [name, email]
                //         );

                //         // release the connection back to the pool
                //         await connection.close();
                //         await pool.close();

                //         // return the inserted user's ID
                //         return result.outBinds[0];

                //     } catch (err) {
                //         console.error(err);
                //         throw err;
                //     }
                // }
                resolve: async (parent, { name, email }) => {

                    const connection = await pool.getConnection();

                    await connection.execute('INSERT INTO employees(name, email) VALUES(:name, :email) RETURNING *', [name, email], async (err, result) => {
                        if (err) {
                            console.log("err")
                            return err
                        } else {
                            console.log("success")
                            await connection.close();
                            await pool.close();
                            return result.rows[0];
                        }
                    });
                },
            },
            updateUser: {
                type: UserType,
                args: {
                    id: { type: GraphQLNonNull(GraphQLInt) },
                    name: { type: GraphQLNonNull(GraphQLString) },
                    email: { type: GraphQLNonNull(GraphQLString) },
                },
                resolve: async (parent, { id, name, email }) => {
                    const connection = await pool.getConnection();
                    await connection.execute('UPDATE employees SET name = :name, email = :email WHERE id = :id RETURNING *', [name, email, id], async (err, result) => {
                        if (err) {
                            return err
                        } else {
                            console.log("success")
                            await connection.close();
                            return result.rows[0];
                        }
                    });

                },
            },
            deleteUser: {
                type: UserType,
                args: {
                    id: { type: GraphQLNonNull(GraphQLInt) },
                },
                resolve: async (parent, { id }) => {
                    const connection = await pool.getConnection();
                    const result = await connection.execute(`DELETE FROM employees WHERE id = :id RETURNING *`, [id]);
                    await connection.close();
                    return result.rows[0];
                },
            },
        })
    })

    //     const typeDefs = `
    //   type User {
    //     id: Int!
    //     name: String!
    //     email: String!
    //   }

    //   input UserInput {
    //     name: String!
    //     email: String!
    //   }

    //   type Query {
    //     greeting:String
    //     employees: [User!]!
    //     getUser(id: Int!): User
    //     getUsers: [User]
    //   }

    //   type Mutation {
    //     createUser(input: UserInput): User
    //     updateUser(id: Int!, input: UserInput): User
    //     deleteUser(id: Int!): User
    //   }
    // `;

    // const resolvers = {
    //     Query: {
    //         greeting: () => "hello",
    //         employees: async () => {
    //             let connection;

    //             try {
    //                 connection = await oracledb.getConnection({
    //                     user: 'SYSTEM',
    //                     password: 'root123',
    //                     connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=CIPL1117UI)(PORT=1522))(CONNECT_DATA=(SERVER=DEDICATED)(SID=xe)))',
    //                 });

    //                 const result = await connection.execute(`
    //                 SELECT *
    //                 FROM employees
    //               `);

    //                 console.log("Result", result);


    //                 var valueTab = await result.rows.map((row: any) => {
    //                     console.log(row)
    //                     return row.ID
    //                     // name: row.NAME,
    //                     // email: row.EMAIL,
    //                 })

    //                 console.log("Valuue", valueTab);

    //             } catch (error) {
    //                 console.error(error);
    //                 throw error;
    //             } finally {
    //                 if (connection) {
    //                     try {
    //                         await connection.close();
    //                     } catch (error) {
    //                         console.error(error);
    //                     }
    //                 }
    //             }
    //         },
    //         getUser: async (_, { id }) => {
    //             const connection = await pool.getConnection();
    //             const result = await connection.execute(
    //                 `SELECT * FROM employees WHERE id = :id`,
    //                 [id]
    //             );
    //             const user = await result.rows[0];

    //             console.log("user", user)
    //             await connection.close();

    //             return await user;
    //         },
    //         getUsers: async () => {

    //             const connection = await pool.getConnection();
    //             const result = await connection.execute(`SELECT * FROM employees`);
    //             console.log(result.rows)
    //             const users = await result.rows;
    //             return users;
    //             await connection.close();


    //         },
    //     },
    //     Mutation: {
    //         createUser: async (_, { input }) => {

    //             const connection = await pool.getConnection();

    //             console.log("hloooo");

    //             // const result = await connection.execute(`INSERT INTO employees VALUES (
    //             //     '{ "name": ":name", "email": ":email"}');
    //             // COMMIT;`)

    //             const result = await connection.execute(`INSERT INTO employees( name, email) VALUES (:name, :email)`, [input.name, input.email] || {});

    //             console.log(result)

    //             var valueTab = await result.rows.map((row: any) => {
    //                 console.log(row)
    //                 return row.ID
    //                 // name: row.NAME,
    //                 // email: row.EMAIL,
    //             })
    //             // const res = await result.rows[0];
    //             console.log(valueTab)
    //             const user = await result.rows[0];



    //             await connection.close();
    //             return user;
    //             // return user;
    //         },
    //         updateUser: async (_, { id, input }) => {
    //             const connection = await pool.getConnection();
    //             const result = await connection.execute(
    //                 `UPDATE employees SET name = :name, email = :email WHERE id = :id RETURNING *`,
    //                 [input.name, input.email, id]
    //             );
    //             const user = result.rows[0];
    //             await connection.close();
    //             return user;
    //         },
    //         deleteUser: async (_, { id }) => {
    //             const connection = await pool.getConnection();
    //             const result = await connection.execute(
    //                 `DELETE FROM employees WHERE id = :id `,
    //                 [id]
    //             );
    //             console.log(result)
    //             const user = result.rows[0];
    //             await connection.close();
    //             return user;
    //         },
    //     },
    // };

    const schema = new GraphQLSchema({
        query: QueryType,
        mutation: MutationType,
    });

    const server = new ApolloServer({ schema });

    await server.start();

    server.applyMiddleware({ app });

    app.listen(4000, () =>
        console.log(
            'Server ready at http://localhost:4000/graphql'
        )
    );

}

startApolloServer()

