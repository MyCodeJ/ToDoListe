const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async (event, context) => {
  const path = event.path.replace('/.netlify/functions/todos', '');
  const segments = path.split('/').filter(Boolean);
  
  try {
    switch (event.httpMethod) {
      case 'GET':
        return {
          statusCode: 200,
          body: JSON.stringify(
            await client.query(
              q.Map(
                q.Paginate(q.Documents(q.Collection('todos'))),
                q.Lambda(x => q.Get(x))
              )
            )
          )
        };

      case 'POST':
        const todoData = JSON.parse(event.body);
        return {
          statusCode: 201,
          body: JSON.stringify(
            await client.query(
              q.Create(q.Collection('todos'), {
                data: todoData
              })
            )
          )
        };

      case 'PATCH':
        if (segments.length > 0) {
          const todoId = segments[0];
          const data = JSON.parse(event.body);
          return {
            statusCode: 200,
            body: JSON.stringify(
              await client.query(
                q.Update(q.Ref(q.Collection('todos'), todoId), {
                  data: data
                })
              )
            )
          };
        }
        break;

      case 'DELETE':
        if (segments.length > 0) {
          const todoId = segments[0];
          await client.query(
            q.Delete(q.Ref(q.Collection('todos'), todoId))
          );
          return {
            statusCode: 204,
            body: ''
          };
        }
        break;
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 