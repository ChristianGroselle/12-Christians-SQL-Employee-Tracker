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
    user: "root",
    password: "toor",
    database: "employee_db",
  },
  console.log(`Connected to the employee_db database.`)
);

//question for the main menu
const mainMenu = [
  {
    type: "list",
    name: "choice",
    message: "What would you like to do?",
    choices: [
      { name: "View all departments", value: "view_departments" },
      { name: "Add a department", value: "add_department" },
      { name: "View all roles", value: "view_roles" },
      { name: "Add a role", value: "add_role" },
      { name: "View all employees", value: "view_employees" },
      { name: "Add an employee", value: "add_employee" },
      { name: "Update an employee role", value: "update_employee_role" },
      { name: "Exit", value: "exit" },
    ],
  },
];

//returns the department table
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

//adding a new department to the department table
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

//returns a table of the roles table that includes the departments that the roles belong to
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

//function for adding a new role to the database
const addRole = async () => {
  db.query("SELECT * FROM department", function (error, departments) {
    if (error) throw error;

    const departmentChoices = departments.map((department) => {
      return {
        name: department.name,
        value: department.id,
      };
    });

    inquirer
      .prompt([
        {
          type: "input",
          name: "title",
          message: "Enter role title:",
        },
        {
          type: "input",
          name: "salary",
          message: "Enter role salary:",
        },
        {
          type: "list",
          name: "department_id",
          message: "Select department:",
          choices: departmentChoices,
        },
      ])
      .then((answers) => {
        const { title, salary, department_id } = answers;

        db.query(
          "INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)",
          [title, salary, department_id],
          function (error, results) {
            if (error) throw error;
            console.log(`Role "${title}" added with ID: ${results.insertId}`);
            startInterface();
          }
        );
      });
  });
};

//returns a table that includes the Employee table with the names, role, salary, department, manager
async function getEmployees() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT 
      employee.id,
      CONCAT(employee.first_name, ' ', employee.last_name) AS name,
      role.title AS role,
      department.name AS department,
      role.salary,
      CONCAT(manager.first_name, ' ', manager.last_name) AS manager
      FROM employee
      LEFT JOIN role ON employee.role_id = role.id
      LEFT JOIN department ON role.department_id = department.id
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

async function addEmployee() {
  const roles = await getWorkableRoles();
  const managers = await getWorkableManagers();
  const answers = await inquirer.prompt([
    {
      name: "first_name",
      type: "input",
      message: "Enter the first name of the employee:",
    },
    {
      name: "last_name",
      type: "input",
      message: "Enter the last name of the employee:",
    },
    {
      name: "role_id",
      type: "list",
      message: "Select the role for the employee:",
      choices: roles.map((role) => ({
        name: role.title,
        value: role.id,
      })),
    },
    {
      name: "manager_id",
      type: "list",
      message: "Select the manager for the employee:",
      choices: [{ name: "None", value: null }].concat(
        managers.map((manager) => ({
          name: `${manager.first_name} ${manager.last_name}`,
          value: manager.id,
        }))
      ),
    },
  ]);

  const query = `
      INSERT INTO employee (first_name, last_name, role_id, manager_id)
      VALUES (?, ?, ?, ?)
    `;

  db.query(
    query,
    [
      answers.first_name,
      answers.last_name,
      answers.role_id,
      answers.manager_id,
    ],
    function (error, results) {
      if (error) {
        console.error(error);
        return;
      }

      console.log("Employee added successfully!");
      startInterface();
    }
  );
}

function getWorkableRoles() {
  return new Promise((resolve, reject) => {
    db.query("SELECT id, title FROM role", function (error, results) {
      if (error) {
        reject(error);
        return;
      }

      resolve(results);
    });
  });
}

function getWorkableManagers() {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT id, first_name, last_name FROM employee",
      function (error, results) {
        if (error) {
          reject(error);
          return;
        }

        resolve(results);
      }
    );
  });
}

async function updateEmployeeRole() {
  // Prompt user for employee information
  const employeeAnswers = await inquirer.prompt([
    {
      type: "input",
      name: "employeeId",
      message: "Enter the id of the employee you want to update:",
    },
    {
      type: "list",
      name: "newRole",
      message: "Choose the new role for the employee:",
      choices: async function () {
        // Get the list of roles from the database
        const [roles] = await db.promise().query("SELECT id, title FROM role");

        // Map the roles to choices
        return roles.map(({ id, title }) => ({
          name: title,
          value: id,
        }));
      },
    },
  ]);

  // Update the employee's role in the database
  db.query(
    "UPDATE employee SET role_id = ? WHERE id = ?",
    [employeeAnswers.newRole, employeeAnswers.employeeId],
    function (error, results) {
      if (error) throw error;
      console.log(
        `Successfully updated the role of employee with id ${employeeAnswers.employeeId}`
      );
      startInterface();
    }
  );
}
//runs the main menu prompt
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
      break;
    case "add_role":
      addRole();
      break;
    case "add_employee":
      addEmployee();
      break;
    case "update_employee_role":
      updateEmployeeRole();
      break;
    case "exit":
      db.end;
      break;
  }
}

startInterface();
