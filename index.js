import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { MongoCryptInvalidArgumentError } from "mongodb";

const app = express();
const port = 3000;

//New client set up
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "todolist",
  password: "123456!",
  port: 5432,
});

//conect to database
db.connect();

//Middelwear
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;


//Functions 
//Get shorter date
function getDate(date){
    let day = ("0" + date.getDate()).slice(-2);  //Get day
    let month = ("0" + (date.getMonth() + 1)).slice(-2);// get current month
    let year = date.getFullYear(); // get current year
    let shorter_Date=(year + "-" + month + "-" + day);
    return shorter_Date;
  }
//Get Current user items 
async function currentUserItems(id){
  const result=await db.query("SELECT items.id , title, creation_date, lists_id, users_id FROM items JOIN users ON users.id = users_id WHERE users_id =($1) ORDER BY items.id ASC;",
      [id]
    );
    let items= result.rows;
   
    items.forEach((item) => {
      item.creation_date=getDate(item.creation_date);  
    });
    return items; 
}
 //Get Users
 async function getUsers() {
  const usersList=await db.query("SELECT * FROM users;");
  return usersList.rows;
 }
//Get last id from users table 
 async function getlastId() {
  let usersLastID;
  let listsLastID;

  try{
      usersLastID=await db.query("SELECT id FROM users ORDER BY id DESC LIMIT 1;");
      console.log(usersLastID);
      if(usersLastID.rowCount>0){
         console.log("there is users on the table")
          usersLastID=usersLastID.rows[0].id;
          console.log(usersLastID);
        }else{
          console.log("There is no users in the table, add a new user");
          usersLastID=0;
        }
      try{
        listsLastID=await db.query("SELECT id FROM lists ORDER BY id DESC LIMIT 1;");
        if (listsLastID.rowCount>0){
          listsLastID=listsLastID.rows[0].id;
          console.log(listsLastID);
        }else{
          console.log("There is no lists in the list table ");
          listsLastID=0;
        }
      }catch(err){
        console.log(err); 
      }
    }catch(err){
        console.log(err);
    }
    const lastId={
      usersLastId:usersLastID,
      listsLastId:listsLastID,
    }
    console.log(lastId);
    return lastId;
 }
//Add new user
async function addNewUser(id,name,color ){
  console.log("Adding new user "+name);
    const result = await db.query(
    "INSERT INTO users (id, users_name, color) VALUES($1, $2, $3) RETURNING *;",
    [id, name, color]   
  );
  return result.rows;
}
//Get lists 
async function getUsersLists(id){
  const result=await db.query("SELECT lists.id ,lists_name, color FROM lists JOIN users ON users.id=lists.user_id WHERE users.id=$1;",
  [id]);
  return result.rows;
}

//GET HOME PAGE
app.get("/", async (req, res) => {    
  try{
    console.log("Loading home page");
    const users=await getUsers();
    const items=await currentUserItems(currentUserId);
    const list=await getUsersLists(currentUserId);
    res.render("index.ejs", {
      listItems:items,
      lists:list,
      users:users,
    });
  }
  catch(err){
    console.log(err);
    res.status(400).send(err.message);
  }
});

//USERS
//Users tab
app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("newUser.ejs");
  }
  else if(req.body.removeUser==="removeUser"){
    res.redirect("/deleteUser");
  }
  else {
    currentUserId = req.body.user;
    console.log(currentUserId);
    res.redirect("/");
  }
});

//Add new user 
app.post("/new", async (req, res) => {
  const user_name = req.body.name;
  const user_color= req.body.color;
  try{
    const lastId=await getlastId();
    let new_user= await addNewUser(lastId.usersLastId+1, user_name, user_color);
    currentUserId = new_user[0].id;
    
    const list1=await db.query("INSERT INTO lists(id, lists_name, user_id) VALUES ($1, $2, $3)  RETURNING *;",
      [lastId.listsLastId+1,"Today", currentUserId, ]
    );
    const list2=await db.query("INSERT INTO lists(id, lists_name, user_id) VALUES ($1, $2, $3)  RETURNING *;",
      [lastId.listsLastId+2,"Week", currentUserId]
    );
    const list3=await db.query("INSERT INTO lists(id, lists_name, user_id) VALUES ($1, $2, $3)  RETURNING *;",
      [lastId.listsLastId+3,"Month", currentUserId]
    );
  
    //Redirect home 
    res.redirect("/");
  }
  catch(err){
    console.log(err);
    res.status(400).send(err.message);
  }  
});

//Delete user
app.get("/deleteUser", async  (req,res) => {
  const deleteUserId=currentUserId;
  console.log(deleteUserId);
  try{
     //Delete lists items 
      const deleteItems=await db.query("DELETE FROM items WHERE users_id=$1 RETURNING *; ",
      [deleteUserId]);
      console.log(deleteItems.fields);  
      const result=await db.query("DELETE FROM lists WHERE user_id=$1 RETURNING *; ",
      [deleteUserId]
      );
      console.log(result.rows);
      const results=await db.query("DELETE FROM users WHERE users.id=$1 RETURNING *; ",
     [deleteUserId]
      );
      console.log(results.rows);
      console.log("finished deleting user");
      const resu=await db.query("SELECT * FROM users ORDER BY id ASC LIMIT 1");
      currentUserId=resu.rows[0].id;
      res.redirect("/");

  }catch(err){
    console.log(err);
    res.status(400).send(err.message);
  }
});



//LISTS
//post new List
app.post("/newList", async (req, res) => {
  if (req.body.addList === "newList") {
   res.render("newList.ejs");
 }
 else {
   currentUserId = req.body.user;
   res.redirect("/");
 }
});

//Add new list
app.post("/newlists", async  (req,res) => {
  const newList={
    newListId:(await getlastId()).listsLastId+1,
    newListsName:req.body.listName,
    userId:currentUserId
  }
  console.log(newList);
  try{
    const result=db.query("INSERT INTO lists (id, lists_name, user_id) VALUES ($1,$2,$3) RETURNING *;",
      [newList.newListId, newList.newListsName, newList.userId]
    );
    res.redirect("/");
  }
  catch(err){
    console.log(err);
    res.status(400).send(err.message);
  }
});
//Delete list
app.post("/deleteList", async  (req,res) => {
  const deleteList={
    deleteListId:req.body.listId,
    deleteListsName:req.body.deleteListName,
    userId:currentUserId
  }
  // console.log(deleteList);
  try{ 
    //Delete lists items 
    const deletedItems=await db.query("DELETE FROM items WHERE lists_id=$1 RETURNING *; ",
      [deleteList.deleteListId]);
     
    const result=db.query("DELETE FROM lists WHERE lists.id=$1 RETURNING *; ",
        [deleteList.deleteListId]
      );
    res.redirect("/");

  }catch(err){
    console.log(err);
    res.status(400).send(err.message);
  }
  
});
//Edit list Name
app.post("/editList", async (req, res) => {
  const editList={
    listId :req.body.updatedListId,
    listName:req.body.updatedListName,
  } 
  try{
     const result= await db.query(
      "UPDATE lists SET lists_name = $1 WHERE lists.id = $2 RETURNING * ;",
      [editList.listName,editList.listId]
      
    );
    res.redirect("/");
  }
  catch(err){
    console.log(err);
    res.status(400).send(err.message);
  }
});


//ITEMS
//Add new  item to list 
app.post("/add", async (req, res) => {
  const newItem ={
    title:req.body.newItem,
    creation_date:getDate(new Date()),
    lists_id:req.body.listId,
    users_id:currentUserId,
    list_name:req.body.list,
  }
  try{
      const result= await db.query(`INSERT INTO items (title, creation_date, lists_id, users_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [newItem.title,newItem.creation_date,newItem.lists_id,newItem.users_id]
      );
      res.redirect("/");
    }
    catch(err){
      console.log(err);
      res.status(400).send(err.message);
    }
});

//Edit item from lists
app.post("/edit", async (req, res) => {
  const editItem={
    items_id :req.body.updatedItemId,
    title:req.body.updatedItemTitle,
    creation_date:getDate(new Date()),
  } 
  try{
     const result= await db.query(
      "UPDATE items SET title = $1, creation_date= $2  WHERE items.id = $3 RETURNING * ;",
      [editItem.title,editItem.creation_date, editItem.items_id]
      
    );
    res.redirect("/");
  }
  catch(err){
    console.log(err);
    res.status(400).send(err.message);
  }
});

//Delete item from lists 
app.post("/delete/", async  (req, res) => {
  let deleteItemId=req.body.deleteItemId;
  try{
     const result=await db.query("DELETE FROM items WHERE items.id=$1 RETURNING *; ",
      [deleteItemId]);
  }
  catch(err){
    console.log(err);
    res.status(400).send(err.message);
  }
  res.redirect("/");
});


//SET UP PORT
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


