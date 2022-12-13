<p align="center">
    <img width="30"  alt="ammarahmed.ca Website Logo" src="./images/LogoIcon.png?raw=true">
</p>
<h1 align="center">GraphQL Server for <a href="https://ammarahmed.ca">ammarahmed.ca</a></h1>

## 👨‍💻 Tech Stack

A high-level overview of the tech stack this website uses:

[**Front-end**](https://github.com/ammar-ahmed22/ammarahmedca)

- [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/) is used for the functionality of the website.
- [ChakraUI](https://chakra-ui.com/) is used to create the standardized and aesthetic UI.
- [Apollo Client](https://www.apollographql.com/docs/react/) is used to handle making GraphQL requests.

**Back-end**

- [Node.js](https://nodejs.org/en/) with [TypeScript](https://www.typescriptlang.org/) is used for the server environment.
- [Notion](https://www.notion.so/product?fredir=1) is used to persist web content (database).
- [Notion API](https://developers.notion.com/) is used to connect the server to Notion
- [TypeGraphQL](https://typegraphql.com/docs/getting-started.html) is used to structure the [GraphQL](https://graphql.org/) API with TypeScript.
- [MongoDB](https://www.mongodb.com/) is used to persist user and game data.
- [Typegoose](https://typegoose.github.io/typegoose/) is used to structure MongoDB data.
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) is used to serve the GraphQL API

**Hosting**

- [Google Firebase](https://firebase.google.com/) is used for the client-side hosting
- [Fly.io](https://fly.io/docs/) is used for the server-side hosting.

## 🔧 How does it work?
<p align="center">
    <img width="800"  alt="server architecture for ammarahmed.ca" src="./images/server-diagram.png?raw=true">
</p>
<p align="center" >
  <em>A high-level diagram of how the server and API is set up.</em>
</p>

There are two distinct sections of this back-end. The first has to do with the website data such as blog posts, projects information, skills and experience. The second has to do with the chess game that is currently being implemented. 

### Website Data
With previous iterations of my website, I found that it was quite annoying to go back into the code everytime I wanted to add/edit a project, experience or blog post to the website. I was using Notion to edit and write out my posts, experiences and project descriptions anyway, so, with the release of the official Notion API, I thought it would be simplify my experience greatly to pull data straight from there into the website. This is precisely what this backend was designed to-do. 

All the data for my website is store in a Notion database. When a request is made to the server, the resolver pulls the data, parses it and sends it to the website. Here's a breakdown of the steps for a project post query:
1. Request made to GraphQL server with the query `projectMetadata`
2. Resolver for `projectMetadata` makes a request to the Notion database using the Notion API
3. Data from Notion is parsed into fields and types that I have defined
4. Data is sent as a response to the query

### Chess Game
As a way for me to get better at my full-stack skills as well as spend some time on a fun project, I decided to add a chess game feature to my website which is still in progress. The general idea is that visitors to my website can create an account and play a no time limit chess game against me. Users would initiate a game and then I'd be notified of this. After each move, the opponent is notifed by email that their opponent has made their move and they can come back to play theirs. 

All the game logic on the front-end is also implemnted by me as a learning exercise. 

The back-end architecture for the game uses MongoDB to store user and game data. The GraphQL API is authenticated using json web tokens (JWT). 

### Technology Choices
**Node.js (TypeScript)**<br />
As I'm quite comfortable with TypeScript, this was the obvious choice for me.

**GraphQL** <br />
GraphQL API's are the status quo for modern API's due to their obvious advantages over REST API's. GraphQL API's allow for more fine-tuned requests which saves on data as the user can request exactly which fields they need. It also makes for easier implementation as all requests are made to the same endpoint.

**TypeGraphQL and Typegoose** <br />
In order to structure the API and database documents, I implemented two libraries, TypeGraphQL and Typegoose. They work very well together as they operate on the same fundamentals. 

The popular JavaScript framework, mongoose, allows for creating database models that can be used to easily create and access MongoDB documents. They do this by defining classes called "schemas" in which you can define properties and types for documents. The issue is that mongoose does not do a very good job with making typed classes for use with TypeScript. While all MongoDB properties have types, when using with TypeScript types are not known to the compiler. Typegoose allows for defining types both in MongoDB as well as TypeScript. 

TypeGraphQL is used for the same principle as above. With a typical GraphQL API, types would need to be re-defined in many places when using TypeScript. The types would need to be set in the GraphQL schema as well as with the resolver functions for the API. TypeGraphQL allows you to create a single TypeScript class which will auto-generate the schema as well as be used as a regular TypeScript class for the resolvers. 

The reason the TypeGraphQL and Typegoose work so well together is because they both use TypeScript decorators to define the properties and classes. Therefore, you can create a GraphQL return type and a MongoDB model at the same time which cuts down on development time and debugging greatly.  
Here's a quick example of what a simple user class would look like using TypeGraphQL and Typegoose:
```typescript
@ObjectType() // TypeGraphQL decorator
@modelOptions({ // Typegoose decorator
  schemaOptions: {
    collection: "users"
  }
})
class User{
  
  @Field() // TypeGraphQL property decorator
  @prop({ required: true, unique: true }) // Typegoose property decorator
  public username: string

  @Field()
  @prop({ required: true, unique: true })
  public email: string

  @Field()
  @prop({ required: true })
  public name: string

  @Field(returns => Int, { nullable: true })
  @prop({ required: false })
  public age?: number
 
}
```

This would generate a GraphQL schema that looks like this: 

```graphql
type User = {
  username: String!
  email: String!
  name: String!
  age: Int
}
```

The current implementation for the chess game implements authentication by requiring an Authorization header to be set to access any authorized queries or mutations. Any authorized mutations which do not send back data, will return a new JWT to be used in subsequent requests. e.g. the login mutation will send back a JWT. 

You can see the API documentation here: 

## 💬 Feedback

If you have any feedback, please reach out to me at ammar.ahmed1@uwaterloo.ca. If you find any bugs, please create an issue or feel free to make a PR with a fix.

## 📋 Articles/References

#### Docs

- [Apollo GraphQL](https://www.apollographql.com/docs/)
- [Notion API](https://developers.notion.com/reference/intro)
- [TypeGraphQL](https://typegraphql.com/docs/getting-started.html)
- [Typegoose](https://typegoose.github.io/typegoose/)

#### Chess (Coming soon...)

- [JWT Frontend Token Authentication](https://medium.com/ovrsea/token-authentication-with-react-and-apollo-client-a-detailed-example-a3cc23760e9)
- [GraphQL Authentication](https://www.youtube.com/watch?v=dBuU61ABEDs)
- [FEN Strings for Chess games](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
- [FEN Generator for testing](http://www.netreal.de/Forsyth-Edwards-Notation/index.php)
<!-- - [Google Authentication](https://dev.to/sivaneshs/add-google-login-to-your-react-apps-in-10-mins-4del)
- [Backend Authentication with Google](https://developers.google.com/identity/sign-in/web/backend-auth) -->


