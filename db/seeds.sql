-- Populate the department table
INSERT INTO department (id, name) VALUES
  (1, 'Marketing'),
  (2, 'Sales'),
  (3, 'Engineering');

-- Populate the role table
INSERT INTO role (id, title, salary, department_id) VALUES
  (1, 'Marketing Manager', 80000, 1),
  (2, 'Sales Representative', 55000, 2),
  (3, 'Software Engineer', 90000, 3),
  (4, 'Sales Manager', 95000, 2),
  (5, 'Product Manager', 100000, 1);

-- Populate the employee table
INSERT INTO employee (id, first_name, last_name, role_id, manager_id) VALUES
  (1, 'John', 'Doe', 1, null),
  (2, 'Jane', 'Doe', 2, 1),
  (3, 'Bob', 'Smith', 3, 1),
  (4, 'Alice', 'Johnson', 4, 1),
  (5, 'Charlie', 'Brown', 5, 1);
