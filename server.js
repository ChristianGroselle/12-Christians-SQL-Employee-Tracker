const express = require("express");
const inquirer = require("inquirer");
const mysql = require("mysql2");

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const db = mysql.createConnection(
  {
    host: "localhost",
    // MySQL username,
    user: "root",
    // TODO: Add MySQL password here
    password: "toor",
    database: "employee_db",
  },
  console.log(`Connected to the employee_db database.`)
);

const mainMenu = [
  {
    type: "list",
    name: "choice",
    message: "What would you like to do?",
    choices: [
      { name: "View all departments", value: "view_departments" },
      { name: "View all roles", value: "view_roles" },
      { name: "View all employees", value: "view_employees" },
      { name: "Add a department", value: "add_department" },
      { name: "Add a role", value: "add_role" },
      { name: "Add an employee", value: "add_employee" },
      { name: "Update an employee role", value: "update_employee_role" },
      { name: "Exit", value: "exit" },
    ],
  },
];

const addRole = [
  {
    type: "input",
    name: "role_title",
    message: "Enter the title of the role:",
  },
  {
    type: "input",
    name: "role_salary",
    message: "Enter the salary for the role:",
  },
  {
    type: "input",
    name: "department_id",
    message: "Enter the department ID for the role:",
  },
];

const addEmployee = [
  {
    type: "input",
    name: "first_name",
    message: "Enter the first name of the employee:",
  },
  {
    type: "input",
    name: "last_name",
    message: "Enter the last name of the employee:",
  },
  {
    type: "input",
    name: "role_id",
    message: "Enter the role ID of the employee:",
  },
  {
    type: "input",
    name: "manager_id",
    message: "Enter the manager ID of the employee (enter null if no manager):",
  },
];

const updateEmployeeRole = [
  {
    type: "input",
    name: "employee_id",
    message: "Enter the ID of the employee to update:",
  },
  {
    type: "input",
    name: "new_role_id",
    message: "Enter the new role ID for the employee:",
  },
];

async function getDepartments() {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM department", function (err, rows) {
      if (err) {
        console.error("Error querying database: " + err.stack);
        return reject(err);
      }

      return resolve(rows);
    });
  });
}

const addDepartment = async () => {
  const { name } = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Enter the name of the department: ",
    },
  ]);

  db.query(
    `INSERT INTO department (name) VALUES ('${name}')`,
    (error, results) => {
      if (error) throw error;
      console.log(`Department '${name}' added successfully!`);
      startInterface();
    }
  );
};

async function getRoles() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT role.id, role.title, department.name AS department, role.salary FROM role JOIN department ON role.department_id = department.id`,
      function (err, rows) {
        if (err) {
          console.error("Error querying database: " + err.stack);
          return reject(err);
        }

        return resolve(rows);
      }
    );
  });
}

async function getEmployees() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT 
      employee.id,
      CONCAT(employee.first_name, ' ', employee.last_name) AS name,
      role.title AS role,
      role.salary,
      CONCAT(manager.first_name, ' ', manager.last_name) AS manager
      FROM employee
      LEFT JOIN role ON employee.role_id = role.id
      LEFT JOIN employee AS manager ON employee.manager_id = manager.id;`,
      function (err, rows) {
        if (err) {
          console.error("Error querying database: " + err.stack);
          return reject(err);
        }

        return resolve(rows);
      }
    );
  });
}

async function startInterface(display) {
  if (display) {
    console.table(display);
  }
  menu = await inquirer.prompt(mainMenu);
  switch (menu.choice) {
    case "view_departments":
      getDepartments()
        .then((rows) => {
          startInterface(rows);
        })
        .catch((err) => {
          console.error("Error querying departments:", err);
          startInterface("Error querying departments");
        });

      break;
    case "view_roles":
      getRoles()
        .then((rows) => {
          startInterface(rows);
        })
        .catch((err) => {
          console.error("Error querying roles:", err);
          startInterface("Error querying roles");
        });
      break;
    case "view_employees":
      getEmployees()
        .then((rows) => {
          startInterface(rows);
        })
        .catch((err) => {
          console.error("Error querying employees:", err);
          startInterface("Error querying employees");
        });
      break;
    case "add_department":
      addDepartment();
  }
}

startInterface();
