import type { Level } from "../types";
import type { PathDef, PathPuzzle, PathQuestion } from "./types";

type Seat = "basics" | "joins" | "aggregation" | "advanced" | "performance" | "integrity";
type Draft = Omit<PathQuestion, "level" | "seat"> & { reveal: string };

function ask(level: Level, seat: Seat, drafts: Draft[]): PathQuestion[] {
  return drafts.map((draft) => ({ ...draft, level, seat }));
}

const LEVEL_1: PathQuestion[] = [
  ...ask(1, "basics", [
    {
      id: "sql-1-null-equals",
      prompt: "Some users have no email on file:\nSELECT id FROM users\nWHERE email = NULL;\nWhat does this return?",
      options: ["No rows at all", "Every user with no email", "Every user, since NULL matches anything", "A syntax error"],
      hint: "Compare anything with an unknown value. Is the result true?",
      senior:
        "email = NULL evaluates to NULL (unknown) for every row, and WHERE keeps only rows where the condition is true. It is valid SQL, just useless; IS NULL is the test you want.",
      principle: "NULL comparison",
      why: "It is the most common NULL bug in real code, and it fails silently instead of raising an error.",
      reveal: "No rows: any comparison with NULL yields unknown, and WHERE keeps only true. Use WHERE email IS NULL.",
    },
    {
      id: "sql-1-distinct-pairs",
      prompt: "SELECT DISTINCT city, country\nFROM customers;\nWhat does DISTINCT remove here?",
      options: [
        "Rows where both city and country repeat",
        "Rows where only the city repeats",
        "Duplicate countries; cities are kept as is",
        "Nothing until you add GROUP BY",
      ],
      hint: "DISTINCT applies to the whole select list, not just the first column.",
      senior:
        "DISTINCT compares entire output rows. ('Paris', 'FR') and ('Paris', 'US') are different rows, so both stay.",
      principle: "DISTINCT on rows",
      why: "People often expect DISTINCT to work per column, then wonder why one column still repeats.",
      reveal: "DISTINCT removes rows whose full combination of selected values repeats; Paris in two countries stays twice.",
    },
    {
      id: "sql-1-order-default",
      prompt: "With no ASC or DESC, which direction does ORDER BY created_at sort?",
      options: ["Ascending, oldest first", "Descending, newest first", "Insertion order", "Whatever order the index uses"],
      hint: "Think of how a dictionary is sorted.",
      senior: "ASC is the default. Write DESC explicitly when you want newest first; the direction is never inferred from an index.",
      principle: "ORDER BY default",
      why: "Feeds and reports often show the wrong end of a list because DESC was assumed.",
      reveal: "ASC is the default, so the oldest timestamps come first.",
    },
    {
      id: "sql-1-limit-no-order",
      prompt: "SELECT * FROM orders\nLIMIT 10;\nWhich 10 rows does this return?",
      options: [
        "Any 10 rows; the order is unspecified",
        "The 10 oldest rows by insertion",
        "The 10 rows with the lowest primary key",
        "The 10 most recently updated rows",
      ],
      hint: "Did the query ask for any particular order?",
      senior:
        "Without ORDER BY, SQL guarantees no order. PostgreSQL often returns rows in physical order, but updates, vacuum, and parallel or synchronized scans change it.",
      principle: "No ORDER BY, no order",
      why: "Code that relies on accidental order passes tests and breaks after the table changes.",
      reveal: "Any 10 rows. Without ORDER BY the order is unspecified, even if it looks stable today.",
    },
  ]),
  ...ask(1, "joins", [
    {
      id: "sql-1-inner-join",
      prompt: "What does customers INNER JOIN orders ON orders.customer_id = customers.id return?",
      options: [
        "Only customer and order pairs that match",
        "Every customer, with or without orders",
        "Every row from both tables, matched or not",
        "Every customer paired with every order",
      ],
      hint: "Inner means both sides must take part.",
      senior:
        "An inner join keeps only pairs where the ON condition is true. Keeping unmatched customers is a LEFT JOIN, keeping both sides is FULL, and every pair is CROSS.",
      principle: "Inner join",
      why: "Choosing the join type is the first decision in nearly every multi-table query.",
      reveal: "Only matching pairs; customers without orders and orders without customers are dropped.",
    },
    {
      id: "sql-1-left-join-null",
      prompt:
        "customers LEFT JOIN orders ON orders.customer_id = customers.id. One customer has no orders. How do they appear?",
      options: [
        "Once, with NULL in every order column",
        "They do not appear at all",
        "Once, with 0 in numeric order columns",
        "Once per row in the orders table",
      ],
      hint: "LEFT keeps every row from the left side. What fills the gap?",
      senior: "The left row survives and the right side is NULL-extended. Nothing becomes 0 unless you COALESCE it.",
      principle: "LEFT JOIN NULL-extension",
      why: "Reading NULL-extended rows correctly is the basis of anti-joins and of correct counts.",
      reveal: "Once, with NULL in all order columns; that is how a LEFT JOIN represents no match.",
    },
    {
      id: "sql-1-cross-join",
      prompt: "sizes has 3 rows and colors has 4. How many rows does sizes CROSS JOIN colors return?",
      options: ["12", "7", "4", "3"],
      hint: "Every size meets every color.",
      senior:
        "A cross join is the Cartesian product: rows on the left times rows on the right. It is also what an inner join becomes when its condition is always true.",
      principle: "Cartesian product",
      why: "An accidental Cartesian product is how a quick query suddenly returns millions of rows.",
      reveal: "12: each of the 3 sizes pairs with each of the 4 colors.",
    },
    {
      id: "sql-1-self-join",
      prompt:
        "employees(id, name, manager_id), where manager_id points at another employee. How do you list each employee beside their manager's name?",
      options: [
        "Join employees to itself under two aliases",
        "GROUP BY manager_id and select the name",
        "UNION employees with itself, then sort",
        "CROSS JOIN employees and keep DISTINCT names",
      ],
      hint: "One copy of the table plays the employee, another plays the manager.",
      senior:
        "FROM employees e JOIN employees m ON m.id = e.manager_id. Use LEFT JOIN so the employee with no manager still appears.",
      principle: "Self join",
      why: "Hierarchies and comparisons between rows of one table come up constantly.",
      reveal: "A self join: FROM employees e LEFT JOIN employees m ON m.id = e.manager_id, selecting e.name and m.name.",
    },
  ]),
  ...ask(1, "aggregation", [
    {
      id: "sql-1-count-star-col",
      prompt: "users has 10 rows, and 3 of them have a NULL email. What do COUNT(*) and COUNT(email) return?",
      options: ["10 and 7", "10 and 10", "7 and 7", "7 and 10"],
      hint: "One counts rows. The other counts values.",
      senior: "COUNT(*) counts rows regardless of content. COUNT(expr) counts rows where expr is not NULL.",
      principle: "COUNT(*) vs COUNT(col)",
      why: "Picking the wrong COUNT quietly changes metrics like 'users with an email'.",
      reveal: "10 and 7: COUNT(*) counts every row, while COUNT(email) skips the 3 NULLs.",
    },
    {
      id: "sql-1-group-by-rows",
      prompt: "SELECT dept_id, COUNT(*)\nFROM employees\nGROUP BY dept_id;\nHow many rows does this return?",
      options: [
        "One per distinct dept_id value",
        "One per employee in the table",
        "One row for the whole table",
        "One per row of the departments table",
      ],
      hint: "GROUP BY collapses rows that share a value.",
      senior:
        "Each distinct dept_id among employees forms one group, including a single group for NULL. Departments with no employees do not appear; the departments table is never read.",
      principle: "GROUP BY",
      why: "Knowing the output grain of a query is how you avoid wrong totals.",
      reveal: "One row per distinct dept_id found in employees; all NULL dept_ids share one group.",
    },
    {
      id: "sql-1-having",
      prompt: "You want only departments with more than 5 employees. Which clause filters on COUNT(*)?",
      options: ["HAVING", "WHERE", "ORDER BY", "LIMIT"],
      hint: "The filter needs the count, so it must run after the groups exist.",
      senior: "WHERE runs before grouping and cannot see aggregates. HAVING runs after GROUP BY: HAVING COUNT(*) > 5.",
      principle: "HAVING",
      why: "WHERE versus HAVING is one of the most frequently asked SQL basics.",
      reveal: "HAVING COUNT(*) > 5, because HAVING filters groups after aggregation.",
    },
    {
      id: "sql-1-sum-null",
      prompt: "A column holds 10, NULL, and 5. What does SUM(col) return?",
      options: ["15", "NULL", "0", "An error"],
      hint: "Aggregates other than COUNT(*) look only at non-NULL values.",
      senior:
        "SUM, AVG, MIN, and MAX ignore NULL inputs. SUM returns NULL only when every input is NULL or there are no rows.",
      principle: "Aggregates skip NULL",
      why: "People expect NULL to poison the total the way it poisons 10 + NULL.",
      reveal: "15: SUM ignores the NULL. Arithmetic like 10 + NULL gives NULL, but aggregates skip it.",
    },
  ]),
  ...ask(1, "advanced", [
    {
      id: "sql-1-in-subquery",
      prompt:
        "SELECT name FROM employees\nWHERE dept_id IN (\n  SELECT id FROM departments\n  WHERE region = 'EU'\n);\nWhat does this return?",
      options: [
        "Employees whose department is in the EU",
        "EU departments that have employees",
        "Every employee, with an EU flag",
        "Employees in the first EU department only",
      ],
      hint: "The inner query builds a list; the outer query checks membership.",
      senior:
        "The subquery returns EU department ids. IN keeps employees whose dept_id is in that set, and each employee appears at most once.",
      principle: "IN subquery",
      why: "Subqueries are the simplest way to filter by facts stored in another table.",
      reveal: "Employees whose dept_id belongs to an EU department, each listed once.",
    },
    {
      id: "sql-1-cte",
      prompt: "What does a WITH clause, a common table expression, define?",
      options: [
        "A named subquery for the statement that follows",
        "A view saved in the schema for every later query",
        "A temporary table other sessions can read",
        "An index hint the planner must follow",
      ],
      hint: "It lives only as long as the one statement that uses it.",
      senior:
        "A CTE names a query you can reference in the main statement. It is not stored in the schema, not visible to other sessions, and not an index hint.",
      principle: "Common table expression",
      why: "CTEs make long queries readable, and interviewers expect you to reach for them.",
      reveal: "A named subquery scoped to a single statement; nothing is stored in the schema.",
    },
    {
      id: "sql-1-window-keeps-rows",
      prompt: "Compared with GROUP BY dept_id, what does SUM(salary) OVER (PARTITION BY dept_id) do?",
      options: [
        "Keeps every row and adds the department total",
        "Returns one row per department, like GROUP BY",
        "Sums only the current row's salary",
        "Requires a GROUP BY dept_id in the same query",
      ],
      hint: "Window functions look across rows without folding them together.",
      senior:
        "OVER computes across a window of related rows but returns one result per input row. GROUP BY collapses each group into one row.",
      principle: "Window vs GROUP BY",
      why: "Window functions answer 'each row plus a group figure' without a self-join.",
      reveal: "It keeps every employee row and adds their department's salary total alongside.",
    },
    {
      id: "sql-1-scalar-subquery",
      prompt: "SELECT name,\n  (SELECT MAX(salary) FROM employees) AS top\nFROM employees;\nWhat is in the top column?",
      options: [
        "The company-wide maximum, on every row",
        "Each employee's own salary",
        "The maximum within each employee's department",
        "An error: subqueries are not allowed in SELECT",
      ],
      hint: "Does the inner query mention the outer row at all?",
      senior:
        "The subquery is uncorrelated, so it has one value for the whole query. A per-department maximum would need WHERE dept_id = outer.dept_id inside it.",
      principle: "Scalar subquery",
      why: "Telling correlated from uncorrelated subqueries is how you read nested SQL quickly.",
      reveal: "The single company-wide maximum, repeated on every row, because the subquery is uncorrelated.",
    },
  ]),
  ...ask(1, "performance", [
    {
      id: "sql-1-index-purpose",
      prompt: "Why add a B-tree index on users(email)?",
      options: [
        "To find rows by email without reading the whole table",
        "To make inserts faster by keeping rows presorted by email",
        "To compress the email column on disk",
        "To force emails to be stored in lowercase",
      ],
      hint: "Think of the index at the back of a book.",
      senior:
        "A B-tree keeps keys sorted, so lookups and ranges take logarithmic time. It makes writes slightly slower, not faster, and never changes the stored values.",
      principle: "B-tree index",
      why: "Every performance conversation starts with what an index buys and what it costs.",
      reveal: "To locate matching rows by email with a few page reads instead of a full table scan.",
    },
    {
      id: "sql-1-index-cost",
      prompt: "What do you pay for each extra index on a table?",
      options: [
        "Slower writes and more disk space",
        "Slower reads on the indexed column",
        "The table becomes read-only",
        "Queries must name the index",
      ],
      hint: "Someone has to keep the index in sync with the table.",
      senior:
        "Every INSERT, and many UPDATEs and DELETEs, must also maintain each index, and each index takes storage and cache. The planner chooses indexes on its own.",
      principle: "Index write cost",
      why: "Senior answers to 'add an index' always mention the write and storage cost.",
      reveal: "Writes must update every index, and each index uses disk and memory.",
    },
    {
      id: "sql-1-explain",
      prompt: "In PostgreSQL, what does EXPLAIN (without ANALYZE) show?",
      options: [
        "The chosen plan with estimated costs and rows",
        "The query's results and actual timing per step",
        "The query rewritten in standard SQL",
        "The locks the query is holding right now",
      ],
      hint: "It describes how the query would run, without running it.",
      senior:
        "EXPLAIN shows the planner's chosen plan and its estimates. EXPLAIN ANALYZE actually executes the query and adds real row counts and timings.",
      principle: "EXPLAIN",
      why: "Reading a plan is the first step of any slow-query investigation.",
      reveal: "The plan the planner would use, with estimated costs and row counts; nothing is executed.",
    },
    {
      id: "sql-1-seq-scan",
      prompt: "In a query plan, what does Seq Scan on orders mean?",
      options: [
        "Every row of orders is read in storage order",
        "Rows are read by walking an index in order",
        "Rows are read in primary key order",
        "Only cached rows of orders are read",
      ],
      hint: "Sequential, as in from the first page to the last.",
      senior:
        "A sequential scan reads the whole table page by page and tests each row. It is the right choice when much of the table matches; an index scan wins when few rows do.",
      principle: "Sequential scan",
      why: "Spotting a seq scan on a large table is the classic first clue in a slow query.",
      reveal: "PostgreSQL reads every page of orders and checks each row against the filter.",
    },
  ]),
  ...ask(1, "integrity", [
    {
      id: "sql-1-primary-key",
      prompt: "What does a PRIMARY KEY guarantee in PostgreSQL?",
      options: [
        "Values are unique and never NULL",
        "Rows are stored sorted by the key",
        "The key is generated automatically",
        "Other tables must reference the key",
      ],
      hint: "Two constraints combined into one.",
      senior:
        "PRIMARY KEY means UNIQUE plus NOT NULL, backed by a unique index. PostgreSQL does not keep the table sorted by it, and generating values needs an identity or a default.",
      principle: "Primary key",
      why: "Keys are the foundation of every join and every integrity guarantee.",
      reveal: "Every value is unique and not NULL, so it identifies exactly one row.",
    },
    {
      id: "sql-1-foreign-key",
      prompt: "orders.customer_id has a FOREIGN KEY to customers.id. What does it prevent?",
      options: [
        "An order pointing to a customer that does not exist",
        "Two orders placed by the same customer on the same day",
        "A customer having no orders",
        "Any order whose customer_id is left NULL on insert",
      ],
      hint: "It checks that the reference points somewhere real.",
      senior:
        "A foreign key requires each non-NULL customer_id to exist in customers. NULL is allowed unless the column is NOT NULL, and there is no limit on orders per customer.",
      principle: "Foreign key",
      why: "Referential integrity stops orphaned rows that break joins and reports.",
      reveal: "It rejects a customer_id that does not exist in customers; NULLs are still allowed without NOT NULL.",
    },
    {
      id: "sql-1-atomicity",
      prompt:
        "A transfer runs two UPDATEs inside BEGIN ... COMMIT: debit account A, then credit account B. The server crashes after the first UPDATE, before COMMIT. After restart:",
      options: [
        "Neither update is applied",
        "Only the debit is applied",
        "Both are applied on recovery",
        "The credit is applied twice",
      ],
      hint: "All or nothing.",
      senior:
        "Atomicity means an uncommitted transaction leaves no trace. Crash recovery keeps only committed work, so the debit is discarded.",
      principle: "Atomicity",
      why: "Money transfers are the canonical example of why transactions exist.",
      reveal: "Neither: the transaction never committed, so recovery discards the debit as well.",
    },
    {
      id: "sql-1-durability",
      prompt:
        "In PostgreSQL with default settings, COMMIT returns success, then the server loses power. The committed change:",
      options: [
        "Survives, because its WAL was flushed first",
        "Is lost unless a checkpoint finished before the crash",
        "Survives only if a replica received it",
        "Is rolled back during crash recovery",
      ],
      hint: "The D in ACID. What must reach disk before COMMIT can report success?",
      senior:
        "With synchronous_commit on, the default, COMMIT waits until its write-ahead log records are flushed. Recovery replays the WAL, so neither checkpoints nor replicas are needed for durability.",
      principle: "Durability and WAL",
      why: "Knowing what COMMIT promises explains WAL, fsync, and the risk of relaxing them.",
      reveal: "It survives: the WAL is flushed before COMMIT returns, and recovery replays it.",
    },
  ]),
];

const LEVEL_2: PathQuestion[] = [
  ...ask(2, "basics", [
    {
      id: "sql-2-alias-in-where",
      prompt: "SELECT price * qty AS total\nFROM items\nWHERE total > 100;\nIn PostgreSQL, what happens when this runs?",
      options: [
        "Error: column total does not exist",
        "Rows with price times qty above 100",
        "Every row; the filter is skipped",
        "Error: aliases need double quotes",
      ],
      hint: "Which clause is evaluated first, WHERE or SELECT?",
      senior:
        "WHERE is evaluated before SELECT computes its outputs, so the alias does not exist yet. Repeat the expression or wrap the query in a subquery or CTE. ORDER BY, which runs last, can use it.",
      principle: "Alias scope",
      why: "Explaining this error shows you understand logical evaluation order, not just syntax.",
      reveal: "An error: WHERE runs before SELECT, so the alias total is not visible there. Repeat price * qty or use a subquery.",
    },
    {
      id: "sql-2-neq-null",
      prompt: "Some orders have a NULL status:\nSELECT * FROM orders\nWHERE status <> 'shipped';\nAre those orders returned?",
      options: [
        "No; NULL <> 'shipped' is unknown",
        "Yes; NULL is not 'shipped'",
        "Yes, but only if status allows NULL",
        "No; the query raises an error",
      ],
      hint: "A comparison with NULL is neither true nor false.",
      senior:
        "NULL <> 'shipped' yields unknown, so WHERE drops the row. Use status IS DISTINCT FROM 'shipped', or add OR status IS NULL.",
      principle: "Three-valued logic",
      why: "Negative filters that silently drop NULL rows are a classic reporting bug.",
      reveal: "No. The comparison is unknown and WHERE keeps only true. IS DISTINCT FROM 'shipped' would include them.",
    },
    {
      id: "sql-2-and-or",
      prompt: "WHERE a = 1 OR b = 2 AND c = 3\nHow does PostgreSQL group this condition?",
      options: [
        "a = 1 OR (b = 2 AND c = 3)",
        "(a = 1 OR b = 2) AND c = 3",
        "Strictly left to right as written",
        "It rejects it as ambiguous",
      ],
      hint: "AND binds tighter, like multiplication over addition.",
      senior:
        "AND has higher precedence than OR. Mixed conditions deserve explicit parentheses anyway, because readers guess wrong.",
      principle: "AND/OR precedence",
      why: "A missing pair of parentheses can widen a DELETE to rows nobody meant to touch.",
      reveal: "AND binds first: a = 1 OR (b = 2 AND c = 3). Add parentheses to say what you mean.",
    },
    {
      id: "sql-2-offset-page",
      prompt: "Pages hold 20 rows and page 1 is the first page. Which clause fetches page 3?",
      options: ["LIMIT 20 OFFSET 40", "LIMIT 20 OFFSET 60", "LIMIT 60 OFFSET 20", "LIMIT 40 OFFSET 20"],
      hint: "How many rows come before page 3?",
      senior:
        "OFFSET skips (page - 1) * size rows: two full pages, 40 rows. LIMIT is the page size. Use a stable ORDER BY, or pages will overlap.",
      principle: "LIMIT and OFFSET",
      why: "Off-by-one pagination bugs are easy to write and easy to test for.",
      reveal: "LIMIT 20 OFFSET 40: skip pages 1 and 2, then take 20.",
    },
  ]),
  ...ask(2, "joins", [
    {
      id: "sql-2-left-join-where",
      prompt:
        "SELECT c.name, o.id\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.status = 'paid';\nWhat happens to customers with no orders?",
      options: [
        "They are dropped, as with an inner join",
        "They appear once with NULL order columns",
        "They appear only if they have unpaid orders",
        "They cause the query to raise an error",
      ],
      hint: "What is o.status on a NULL-extended row, and what does WHERE do with it?",
      senior:
        "Unmatched customers get o.status = NULL, and NULL = 'paid' is unknown, so WHERE removes them. Move the condition into the ON clause to keep them.",
      principle: "Filter placement in outer joins",
      why: "This turns LEFT JOINs into inner joins in production code all the time.",
      reveal: "They are dropped: WHERE o.status = 'paid' rejects the NULL-extended rows. Put the condition in ON to keep them.",
    },
    {
      id: "sql-2-anti-join",
      prompt: "Each option follows SELECT c.* FROM customers c. Which lists customers who have never placed an order?",
      options: [
        "LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL",
        "JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL",
        "LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NOT NULL",
        "LEFT JOIN orders o ON o.customer_id <> c.id WHERE o.id IS NULL",
      ],
      hint: "Keep every customer, then keep only those the join could not match.",
      senior:
        "A LEFT JOIN NULL-extends unmatched customers, and testing a non-nullable right column such as the key for NULL finds them. An inner join never produces such rows, and <> matches nearly everything.",
      principle: "Anti-join",
      why: "'Find rows with no match' is one of the most common interview prompts.",
      reveal: "LEFT JOIN, then WHERE o.id IS NULL. NOT EXISTS is an equally good, often clearer, form.",
    },
    {
      id: "sql-2-fanout",
      prompt:
        "A customer has 3 orders and 2 saved addresses:\nSELECT *\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nJOIN addresses a ON a.customer_id = c.id;\nHow many rows does this return for that customer?",
      options: ["6", "5", "3", "2"],
      hint: "Each order row meets every address row of the same customer.",
      senior:
        "Two independent one-to-many joins on the same key multiply: 3 x 2 = 6. Any aggregate over this result will double or triple count.",
      principle: "Join fan-out",
      why: "Fan-out is the hidden cause of most inflated totals.",
      reveal: "6: each of the 3 orders pairs with each of the 2 addresses.",
    },
    {
      id: "sql-2-full-outer",
      prompt: "Tables a and b each hold user ids. You want the ids present in exactly one of them. Which approach works?",
      options: [
        "FULL OUTER JOIN on id, keep rows where a.id or b.id is NULL",
        "INNER JOIN on id, then keep rows where a.id or b.id is NULL",
        "LEFT JOIN a to b on id, then keep rows where b.id is NULL",
        "CROSS JOIN a and b, keep rows where a.id <> b.id",
      ],
      hint: "You need the unmatched rows from both sides.",
      senior:
        "Only a FULL OUTER JOIN keeps unmatched rows from both tables. A LEFT JOIN finds ids only in a, an inner join never has a NULL key, and a cross join with <> returns nearly every pair.",
      principle: "Full outer join",
      why: "Reconciling two datasets is a daily task in data and billing systems.",
      reveal: "FULL OUTER JOIN, then keep rows where one side's id is NULL; those ids exist in only one table.",
    },
  ]),
  ...ask(2, "aggregation", [
    {
      id: "sql-2-ungrouped-column",
      prompt: "SELECT dept_id, name, COUNT(*)\nFROM employees\nGROUP BY dept_id;\nIn PostgreSQL, what happens when this runs?",
      options: [
        "Error: name must be grouped or aggregated",
        "One row per department, any name",
        "One row per department, first name A to Z",
        "One row per employee with the count",
      ],
      hint: "Which name should a group of ten employees show?",
      senior:
        "Each output row stands for a group, so every selected column must be grouped, aggregated, or depend on a grouped primary key. MySQL without ONLY_FULL_GROUP_BY picks any value; PostgreSQL refuses.",
      principle: "Grouping rule",
      why: "Queries ported from permissive MySQL setups fail on exactly this rule.",
      reveal: "An error: name is neither in GROUP BY nor inside an aggregate.",
    },
    {
      id: "sql-2-where-having",
      prompt: "Which statement about WHERE and HAVING is true?",
      options: [
        "WHERE filters rows; HAVING filters the groups after",
        "HAVING runs before WHERE when both appear in a query",
        "WHERE can test aggregates, while HAVING cannot",
        "They are interchangeable once a GROUP BY is present",
      ],
      hint: "One of them can see COUNT(*); the other cannot.",
      senior:
        "WHERE runs before GROUP BY on individual rows, so it cannot reference aggregates. HAVING runs after grouping. Non-aggregate filters belong in WHERE so fewer rows get grouped.",
      principle: "WHERE vs HAVING",
      why: "Putting row filters in WHERE is both correct and cheaper.",
      reveal: "WHERE filters rows before grouping; HAVING filters groups after aggregation.",
    },
    {
      id: "sql-2-count-distinct",
      prompt: "orders.customer_id holds 1, 1, 2, and NULL. What does COUNT(DISTINCT customer_id) return?",
      options: ["2", "3", "4", "1"],
      hint: "Remove duplicates, then skip NULL.",
      senior: "COUNT(DISTINCT x) counts distinct non-NULL values: {1, 2}. COUNT(*) would be 4 and COUNT(customer_id) 3.",
      principle: "COUNT(DISTINCT)",
      why: "Unique-user metrics hinge on this exact behavior.",
      reveal: "2: the distinct non-NULL values are 1 and 2.",
    },
    {
      id: "sql-2-avg-null",
      prompt: "scores holds 10, 20, and NULL. What does AVG(score) return?",
      options: ["15", "10", "NULL", "20"],
      hint: "How many values does AVG divide by?",
      senior: "AVG skips NULL, so it computes (10 + 20) / 2. If missing means zero, write AVG(COALESCE(score, 0)) to get 10.",
      principle: "AVG and NULL",
      why: "Whether NULL means 'missing' or 'zero' changes a metric, and interviewers want you to ask.",
      reveal: "15: AVG ignores the NULL and divides 30 by 2.",
    },
  ]),
  ...ask(2, "advanced", [
    {
      id: "sql-2-rank-dense",
      prompt: "Scores, highest first, are 90, 90, and 80. For the 80, what do RANK() and DENSE_RANK() return?",
      options: ["RANK 3, DENSE_RANK 2", "RANK 2, DENSE_RANK 3", "RANK 2, DENSE_RANK 2", "RANK 3, DENSE_RANK 3"],
      hint: "One leaves a gap after a tie; the other does not.",
      senior:
        "Both 90s get rank 1. RANK jumps to 3, one more than the number of rows ahead; DENSE_RANK continues at 2. ROW_NUMBER would give 1, 2, 3.",
      principle: "RANK vs DENSE_RANK",
      why: "Top-N questions with ties come up in almost every SQL interview.",
      reveal: "RANK 3 and DENSE_RANK 2: RANK leaves a gap after the tie, DENSE_RANK does not.",
    },
    {
      id: "sql-2-top-per-group",
      prompt: "You need exactly one highest-paid employee per department, even when salaries tie. Which works?",
      options: [
        "ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC), keep 1",
        "DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC), keep 1",
        "GROUP BY dept_id, selecting name and MAX(salary)",
        "ORDER BY salary DESC LIMIT 1",
      ],
      hint: "A tie must not produce two rows.",
      senior:
        "ROW_NUMBER gives unique numbers within each partition, so keeping 1 yields one row. RANK and DENSE_RANK give tied rows 1. Selecting name with GROUP BY errors, and LIMIT 1 is global.",
      principle: "Top-N per group",
      why: "'Latest order per customer' and its cousins appear everywhere.",
      reveal: "ROW_NUMBER partitioned by department, keeping row 1; add a tiebreaker column so the choice is stable.",
    },
    {
      id: "sql-2-lag",
      prompt:
        "SELECT day, amount,\n  LAG(amount) OVER (ORDER BY day) AS prev\nFROM sales;\nWhat is prev on the first row?",
      options: ["NULL", "0", "The first row's own amount", "The last row's amount"],
      hint: "There is no row before the first one.",
      senior: "LAG returns its default when the offset row does not exist, and the default is NULL. LAG(amount, 1, 0) would give 0.",
      principle: "LAG",
      why: "Day-over-day change is a standard analytics question built on LAG.",
      reveal: "NULL, because no earlier row exists; pass a default as the third argument to change it.",
    },
    {
      id: "sql-2-exists",
      prompt:
        "SELECT c.name FROM customers c\nWHERE EXISTS (\n  SELECT 1 FROM orders o\n  WHERE o.customer_id = c.id\n);\nWhat does this return?",
      options: [
        "Each customer with an order, listed once",
        "Each customer once per order they placed",
        "Every customer, since SELECT 1 is truthy",
        "Only customers whose id is 1",
      ],
      hint: "EXISTS asks a yes-or-no question per customer.",
      senior:
        "EXISTS is true if the correlated subquery returns any row; what it selects does not matter. It is a semi-join, so customers are never duplicated.",
      principle: "EXISTS semi-join",
      why: "EXISTS is the clean way to filter by related rows without fan-out.",
      reveal: "Customers who have at least one order, each listed once.",
    },
  ]),
  ...ask(2, "performance", [
    {
      id: "sql-2-leading-wildcard",
      prompt: "users has a plain B-tree index on name. Which predicate cannot use it to narrow the search?",
      options: ["name LIKE '%son'", "name = 'Ada'", "name > 'M'", "name BETWEEN 'A' AND 'C'"],
      hint: "A sorted list helps when you know how the value starts.",
      senior:
        "A B-tree is ordered from the leading characters, so equality and ranges can seek. A pattern that starts with a wildcard gives it no starting point. pg_trgm with a GIN index can serve it.",
      principle: "Leading wildcard",
      why: "Search boxes built on LIKE '%term%' are a classic hidden full scan.",
      reveal: "LIKE '%son' starts with a wildcard, so a B-tree has nowhere to begin; the others are equality or range seeks.",
    },
    {
      id: "sql-2-sargable-date",
      prompt: "orders has an index on created_at, a timestamp. Which filter for 1 January 2026 can use it?",
      options: [
        "created_at >= '2026-01-01' AND created_at < '2026-01-02'",
        "date(created_at) = '2026-01-01'",
        "created_at::date >= '2026-01-01' AND created_at::date < '2026-01-02'",
        "to_char(created_at, 'YYYY-MM-DD') = '2026-01-01'",
      ],
      hint: "Leave the indexed column bare on one side of the comparison.",
      senior:
        "The index stores created_at, not date(created_at). A function or cast on the column hides it from the index unless you build an expression index. A half-open range on the bare column is sargable.",
      principle: "Sargability",
      why: "Functions on indexed columns are the most common reason an index sits unused.",
      reveal: "The half-open range on the bare column; casts and functions on created_at keep the index out of play.",
    },
    {
      id: "sql-2-n-plus-one",
      prompt: "An ORM loads 100 posts, then lazily loads each post's author while the page renders. What is happening?",
      options: [
        "N+1 queries; fetch authors in one join or IN list",
        "One query; ORMs batch lazy loads automatically",
        "Two queries; the database caches the remaining 99",
        "100 queries; the post query is served from cache",
      ],
      hint: "Count the round trips: one for the posts, then one per what?",
      senior:
        "One query for the posts plus one per post for its author makes 101 round trips. Eager loading with a join or WHERE id IN (...) does the same work in one or two.",
      principle: "N+1 queries",
      why: "N+1 is the most common ORM performance bug, and fast local databases hide it.",
      reveal: "N+1: 1 query for posts plus 100 for authors. Load the authors with one join or one IN query.",
    },
    {
      id: "sql-2-leftmost-prefix",
      prompt: "An index exists on (last_name, first_name). Which predicate can seek directly into it?",
      options: [
        "last_name = 'Lovelace'",
        "first_name = 'Ada'",
        "lower(last_name) = 'lovelace'",
        "first_name = 'Ada' OR last_name = 'Lovelace'",
      ],
      hint: "A phone book is sorted by surname first.",
      senior:
        "A composite B-tree is sorted by its first column, then the second within it. A filter on the leading column can seek. first_name alone cannot (PostgreSQL 18 may skip-scan, as a fallback), nor can lower() or an OR.",
      principle: "Leftmost prefix",
      why: "Column order in composite indexes is a favorite interview probe.",
      reveal: "last_name = 'Lovelace' uses the leading column; the others cannot seek directly into this index.",
    },
  ]),
  ...ask(2, "integrity", [
    {
      id: "sql-2-dirty-read",
      prompt: "Which of these is a dirty read?",
      options: [
        "Seeing another transaction's uncommitted change",
        "Reading one row twice and getting two committed values",
        "A repeated query returning extra new rows",
        "Two writers overwriting each other's update",
      ],
      hint: "Dirty means not yet committed.",
      senior:
        "A dirty read sees data that may still roll back. Re-reading a changed row is a non-repeatable read, new rows are phantoms, and overwritten writes are lost updates. PostgreSQL never allows dirty reads.",
      principle: "Dirty read",
      why: "Interviewers use the anomaly names to check that you can talk precisely about isolation.",
      reveal: "Reading data another transaction has written but not yet committed.",
    },
    {
      id: "sql-2-pg-default-isolation",
      prompt: "What is PostgreSQL's default transaction isolation level?",
      options: ["READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE", "READ UNCOMMITTED"],
      hint: "MySQL's InnoDB chose a different default.",
      senior:
        "PostgreSQL defaults to READ COMMITTED: each statement sees data committed before it began. InnoDB defaults to REPEATABLE READ, and the SQL standard's default is SERIALIZABLE.",
      principle: "Default isolation",
      why: "Knowing the default tells you which anomalies your application already allows.",
      reveal: "READ COMMITTED: each statement sees a fresh snapshot of committed data.",
    },
    {
      id: "sql-2-1nf",
      prompt: "customers.phones stores '555-1234, 555-9876' in one text column. Which normal form does that break?",
      options: [
        "First: each value should be a single item",
        "Second: a column depends on part of the key",
        "Third: a column depends on another non-key",
        "None; text columns may hold any string",
      ],
      hint: "Can you index or join on the second phone number?",
      senior:
        "1NF requires atomic values with no repeating groups. A comma list cannot be constrained, indexed, or joined cleanly; a customer_phones table with one row per number can.",
      principle: "First normal form",
      why: "Comma-separated lists in a column are a design smell interviewers expect you to spot.",
      reveal: "1NF: the column holds a list. Move phones to their own table with one row per number.",
    },
    {
      id: "sql-2-cascade",
      prompt: "orders.customer_id REFERENCES customers(id) ON DELETE CASCADE. What does deleting a customer do?",
      options: [
        "Deletes that customer's orders as well",
        "Fails while any order references them",
        "Sets those orders' customer_id to NULL",
        "Deletes the customer, orphaning orders",
      ],
      hint: "Cascade: the delete flows downstream.",
      senior:
        "CASCADE removes the referencing rows. The default NO ACTION, like RESTRICT, would reject the delete; SET NULL would clear the column; a valid foreign key never allows orphans.",
      principle: "ON DELETE actions",
      why: "Choosing the delete rule is a real design decision with data-loss consequences.",
      reveal: "The customer's orders are deleted too; without CASCADE, the default would reject the delete.",
    },
  ]),
];

const LEVEL_3: PathQuestion[] = [
  ...ask(3, "basics", [
    {
      id: "sql-3-not-unknown",
      prompt: "score is NULL on some rows:\nSELECT * FROM results\nWHERE NOT (score > 50);\nAre those rows returned?",
      options: [
        "No; NOT unknown is still unknown",
        "Yes; NOT turns their false into true",
        "Yes; NULL is treated as 0, and 0 <= 50",
        "Only when the score column has a default",
      ],
      hint: "For a NULL score, score > 50 is not false. What is it?",
      senior:
        "NULL > 50 is unknown, and NOT unknown is still unknown, so WHERE drops the row. Negating a predicate does not select its complement when NULLs exist. Write score <= 50 OR score IS NULL.",
      principle: "Three-valued logic",
      why: "Assuming NOT P is the complement of P is how reports silently lose rows.",
      reveal: "No: NOT (NULL > 50) is NOT unknown, which is still unknown, so those rows are filtered out.",
    },
    {
      id: "sql-3-nulls-sort",
      prompt: "SELECT name, score FROM players\nORDER BY score DESC;\nIn PostgreSQL, where do the NULL scores land?",
      options: [
        "First, since NULL sorts as larger than any value",
        "Last, since PostgreSQL always sorts NULLs to the end",
        "In insertion order among the other rows",
        "Nowhere; ORDER BY drops NULL rows",
      ],
      hint: "When sorting, PostgreSQL treats NULL as bigger than everything.",
      senior:
        "By default NULLs sort as if larger than any value: last in ASC, first in DESC. A leaderboard needs ORDER BY score DESC NULLS LAST. Other databases differ, so state it explicitly.",
      principle: "NULL sort order",
      why: "A leaderboard topped by players with no score is a real, visible bug.",
      reveal: "First: PostgreSQL sorts NULLs high, so DESC puts them on top. Add NULLS LAST.",
    },
    {
      id: "sql-3-distinct-on",
      prompt:
        "SELECT DISTINCT ON (customer_id)\n  customer_id, id, created_at\nFROM orders\nORDER BY customer_id, created_at DESC;\nWhat does this PostgreSQL query return?",
      options: [
        "Each customer's most recent order",
        "Each customer's first order ever",
        "All orders with duplicate rows removed",
        "An error: DISTINCT ON needs GROUP BY",
      ],
      hint: "DISTINCT ON keeps the first row of each group, in ORDER BY order.",
      senior:
        "DISTINCT ON (customer_id) keeps the first row per customer_id after sorting. With created_at DESC, that is the latest order. The ORDER BY must start with the DISTINCT ON expressions.",
      principle: "DISTINCT ON",
      why: "It is PostgreSQL's concise answer to 'latest row per group'.",
      reveal: "The most recent order per customer: DISTINCT ON keeps the first row of each customer_id in sort order.",
    },
    {
      id: "sql-3-concat-null",
      prompt:
        "middle_name is NULL for Ada:\nSELECT first_name || ' ' || middle_name\nFROM people;\nIn PostgreSQL, what does this produce for her?",
      options: ["NULL", "'Ada ' with a trailing space", "'Ada NULL'", "An error about NULL text"],
      hint: "Most operators return NULL when any input is NULL.",
      senior:
        "The || operator returns NULL if either side is NULL. concat() and concat_ws() treat NULL as empty, and COALESCE(middle_name, '') works too.",
      principle: "NULL propagation",
      why: "Full names and labels that go blank for some users trace back to this.",
      reveal: "NULL: || propagates NULL. Use concat_ws(' ', first_name, middle_name) or COALESCE.",
    },
  ]),
  ...ask(3, "joins", [
    {
      id: "sql-3-on-filter",
      prompt:
        "SELECT c.name, o.id\nFROM customers c\nLEFT JOIN orders o\n  ON o.customer_id = c.id\n AND o.status = 'paid';\nWhat does this return?",
      options: [
        "Every customer; order columns NULL if no paid order",
        "Only customers who have at least one paid order on file",
        "Every customer with all orders, paid or not",
        "An error: ON may only compare key columns",
      ],
      hint: "In an outer join, ON decides what matches, not what survives.",
      senior:
        "The ON condition restricts which orders match. Customers whose orders are all unpaid still appear, NULL-extended. The same condition in WHERE would drop them.",
      principle: "ON vs WHERE in outer joins",
      why: "Moving one condition between ON and WHERE changes the answer, and seniors know which way.",
      reveal: "Every customer, joined only to their paid orders; customers without one get NULLs.",
    },
    {
      id: "sql-3-sum-fanout",
      prompt:
        "SELECT c.id, SUM(o.total), COUNT(p.id)\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nJOIN payments p ON p.customer_id = c.id\nGROUP BY c.id;\nWhy is revenue too high?",
      options: [
        "Each order repeats once per payment of that customer",
        "SUM treats NULL totals as zero and adds them anyway",
        "GROUP BY c.id counts each customer twice in the output",
        "The JOIN drops orders that have no matching payment",
      ],
      hint: "Orders and payments are both many per customer.",
      senior:
        "Joining two independent one-to-many tables on the customer multiplies rows: 3 orders x 2 payments = 6 rows, so each total is summed twice. Aggregate each table separately, then join the results.",
      principle: "Join fan-out",
      why: "Inflated dashboard numbers are often this exact query.",
      reveal: "Fan-out: each order row is duplicated per payment row. Pre-aggregate orders and payments separately, then join.",
    },
    {
      id: "sql-3-semi-dup",
      prompt:
        "This lists customers who ordered, but names repeat:\nSELECT c.name\nFROM customers c\nJOIN orders o ON o.customer_id = c.id;\nWhich fix is best?",
      options: [
        "Use WHERE EXISTS so each customer appears once",
        "Switch to a LEFT JOIN so the duplicate rows drop out",
        "Add LIMIT 1 after the join condition",
        "Move o.customer_id = c.id into WHERE",
      ],
      hint: "You want to know whether an order exists, not how many.",
      senior:
        "A join returns one row per matching order. EXISTS is a semi-join: each customer appears at most once, and the search can stop at the first match. DISTINCT dedups after the fan-out and merges namesakes.",
      principle: "Semi-join",
      why: "Using EXISTS for existence checks avoids both duplicates and wasted work.",
      reveal: "Rewrite it as WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id).",
    },
    {
      id: "sql-3-null-keys",
      prompt: "a.code and b.code are both NULL on some rows. Do those rows pair up in a JOIN b ON a.code = b.code?",
      options: [
        "No; NULL = NULL is unknown, so they never match",
        "Yes; joins treat NULL keys as equal to each other",
        "Only in a FULL OUTER JOIN",
        "Only when both columns are indexed",
      ],
      hint: "The join condition is just a predicate.",
      senior:
        "ON keeps pairs where the condition is true, and NULL = NULL is unknown. If NULLs should match, use a.code IS NOT DISTINCT FROM b.code, which may plan less efficiently.",
      principle: "NULL in join keys",
      why: "Joins on nullable columns silently lose rows in reconciliation jobs.",
      reveal: "No: NULL = NULL is unknown. Use IS NOT DISTINCT FROM if NULLs should match.",
    },
  ]),
  ...ask(3, "aggregation", [
    {
      id: "sql-3-count-left",
      prompt:
        "Customer 7 has no orders:\nSELECT c.id, COUNT(*)\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id;\nWhat count does this report for them?",
      options: ["1", "0", "NULL", "They are omitted"],
      hint: "How many rows does a NULL-extended customer contribute?",
      senior:
        "The LEFT JOIN yields one NULL-extended row for customer 7, and COUNT(*) counts rows. COUNT(o.id) skips the NULL and returns 0.",
      principle: "COUNT with outer joins",
      why: "'Orders per customer, including zero' is a classic interview task with exactly this trap.",
      reveal: "1: COUNT(*) counts the NULL-extended row. Use COUNT(o.id) to get 0.",
    },
    {
      id: "sql-3-filter-clause",
      prompt: "In PostgreSQL, which expression counts only the paid orders in each group?",
      options: [
        "COUNT(*) FILTER (WHERE status = 'paid')",
        "COUNT(status = 'paid')",
        "SUM(status = 'paid')",
        "COUNT(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)",
      ],
      hint: "COUNT counts non-NULL values, and false is not NULL.",
      senior:
        "FILTER restricts the rows an aggregate sees. COUNT(status = 'paid') counts every non-NULL boolean. The CASE with ELSE 0 is never NULL, so it counts everything. PostgreSQL has no SUM for booleans.",
      principle: "Conditional aggregation",
      why: "Pivot-style reports need several conditional counts in one pass.",
      reveal: "COUNT(*) FILTER (WHERE status = 'paid'); SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) also works.",
    },
    {
      id: "sql-3-having-no-group",
      prompt: "SELECT COUNT(*) FROM orders\nHAVING COUNT(*) > 100;\nWhat does this return in PostgreSQL?",
      options: [
        "One row if over 100 orders, else no rows",
        "An error: HAVING requires a GROUP BY",
        "One row per order once the table passes 100",
        "One row, with NULL if 100 or fewer",
      ],
      hint: "Without GROUP BY, the whole table is one group.",
      senior:
        "An aggregate with no GROUP BY treats all rows as a single group. HAVING then keeps or discards that one group, so the query returns one row or none.",
      principle: "Implicit single group",
      why: "It shows you understand HAVING as a filter on groups, not a GROUP BY accessory.",
      reveal: "One row with the count if it exceeds 100, otherwise zero rows.",
    },
    {
      id: "sql-3-group-by-pk",
      prompt:
        "customers.id is the primary key:\nSELECT c.id, c.name, COUNT(o.id)\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id;\nIn PostgreSQL, what happens when this runs?",
      options: [
        "It runs: name depends on the grouped primary key",
        "Error: c.name must appear in GROUP BY",
        "It runs, but each name is picked arbitrarily from the group",
        "It runs only because the join is LEFT",
      ],
      hint: "Once you know the id, how many names are possible?",
      senior:
        "PostgreSQL accepts columns functionally dependent on a grouped primary key of the same table. Each id has exactly one name, so nothing is arbitrary. The join type is irrelevant.",
      principle: "Functional dependency",
      why: "Knowing the real rule avoids padding GROUP BY with every column, and explains why this works.",
      reveal: "It runs: grouping by the primary key makes c.name functionally dependent, so PostgreSQL allows it.",
    },
  ]),
  ...ask(3, "advanced", [
    {
      id: "sql-3-not-in-null",
      prompt:
        "Some employees have a NULL manager_id:\nSELECT name FROM employees\nWHERE id NOT IN (\n  SELECT manager_id FROM employees\n);\nWhat does this return?",
      options: ["No rows at all", "Employees who manage nobody", "Managers only", "Employees with a NULL manager_id"],
      hint: "Expand NOT IN into a chain of <> comparisons joined by AND.",
      senior:
        "x NOT IN (1, 2, NULL) means x <> 1 AND x <> 2 AND x <> NULL. The last term is unknown, so the whole is never true. Use NOT EXISTS, or filter manager_id IS NOT NULL in the subquery.",
      principle: "NOT IN with NULL",
      why: "This bug returns an empty result with no error, which makes it dangerous.",
      reveal: "No rows: one NULL in the list makes NOT IN unknown for every employee. Use NOT EXISTS.",
    },
    {
      id: "sql-3-correlated",
      prompt:
        "SELECT e.name FROM employees e\nWHERE e.salary > (\n  SELECT AVG(x.salary) FROM employees x\n  WHERE x.dept_id = e.dept_id\n);\nWhat does this return?",
      options: [
        "Employees paid above their department's average",
        "Employees earning above the company-wide average salary",
        "Departments whose average beats the company's",
        "Employees in the best-paid department",
      ],
      hint: "The inner query refers to e, the outer row.",
      senior:
        "x.dept_id = e.dept_id correlates the subquery, so it computes the average of each employee's own department. Without that condition it would be the company average.",
      principle: "Correlated subquery",
      why: "Reading correlation correctly is essential when reviewing other people's SQL.",
      reveal: "Employees whose salary exceeds the average of their own department.",
    },
    {
      id: "sql-3-running-peers",
      prompt:
        "Two rows share the day 2026-03-01:\nSELECT day, amount,\n  SUM(amount) OVER (ORDER BY day) AS running\nFROM sales;\nWhat happens to their running totals?",
      options: [
        "Both get the same total, including both amounts",
        "Each adds only its own amount, one after the other",
        "Both get the total of the whole table",
        "Error: running totals require a ROWS frame",
      ],
      hint: "The default frame is RANGE, and RANGE works on peers.",
      senior:
        "With ORDER BY, the default frame is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, which includes the current row's peers. Use ROWS plus a unique tiebreaker for a strict row-by-row total.",
      principle: "Default window frame",
      why: "Running totals that jump in steps on duplicate keys confuse many report builders.",
      reveal: "Both rows show the same total, covering both amounts, because the default RANGE frame includes peers.",
    },
    {
      id: "sql-3-recursive-sum",
      prompt:
        "WITH RECURSIVE n(x) AS (\n  SELECT 1\n  UNION ALL\n  SELECT x + 1 FROM n WHERE x < 5\n)\nSELECT SUM(x) FROM n;\nWhat does this return?",
      options: ["15", "10", "5", "It never terminates"],
      hint: "List the rows the recursion produces before it stops.",
      senior:
        "The anchor yields 1. Each step adds x + 1 while x < 5, producing 2, 3, 4, and 5. At x = 5 the step returns nothing and recursion stops: 1 + 2 + 3 + 4 + 5 = 15.",
      principle: "Recursive CTE",
      why: "Recursive CTEs power hierarchies and series, and tracing one by hand is a common exercise.",
      reveal: "15: the CTE produces 1 through 5, then WHERE x < 5 ends the recursion.",
    },
  ]),
  ...ask(3, "performance", [
    {
      id: "sql-3-covering",
      prompt:
        "The hot query is `SELECT total FROM orders WHERE customer_id = 7`. You add:\nCREATE INDEX ON orders (customer_id)\n  INCLUDE (total);\nIn PostgreSQL, what does this index give that query?",
      options: [
        "Index-only scans that can skip reading the table",
        "Faster writes, since total is moved out of the table heap",
        "Uniqueness across customer_id and total",
        "Sorted output by total with no ORDER BY",
      ],
      hint: "Everything the query needs is now inside the index.",
      senior:
        "INCLUDE stores total in the index leaf pages without making it part of the key. The query can be answered from the index alone, visiting the heap only for pages not marked all-visible.",
      principle: "Covering index",
      why: "Covering indexes are a precise tool for hot read paths, paid for with write amplification.",
      reveal: "An index-only scan: total is stored in the index, so the table is skipped for all-visible pages.",
    },
    {
      id: "sql-3-selectivity",
      prompt:
        "95% of orders have status 'done', and status is indexed. For SELECT * FROM orders WHERE status = 'done', PostgreSQL will most likely use:",
      options: ["A sequential scan", "An index scan", "An index-only scan", "A bitmap scan on a hash index"],
      hint: "If you will read almost every row anyway, is jumping through an index cheaper?",
      senior:
        "With low selectivity, an index scan would fetch most heap pages in random order. A sequential scan reads them in order and is cheaper. SELECT * also rules out an index-only scan.",
      principle: "Selectivity",
      why: "'Why is my index not used?' often has the answer 'because it should not be'.",
      reveal: "A sequential scan: almost every row matches, so the index would only add random I/O.",
    },
    {
      id: "sql-3-equality-then-range",
      prompt:
        "SELECT * FROM events\nWHERE tenant_id = $1 AND created_at > $2\nORDER BY created_at;\nWhich single index best serves this query?",
      options: [
        "(tenant_id, created_at)",
        "(created_at, tenant_id)",
        "(tenant_id)",
        "(created_at) and (tenant_id) separately",
      ],
      hint: "Equality columns go first, then the range.",
      senior:
        "With tenant_id first, one tenant's rows sit together, already sorted by created_at, so the range is one contiguous slice and ORDER BY needs no sort. Leading with created_at scatters the tenant.",
      principle: "Composite index order",
      why: "Equality first, range last is the rule interviewers expect for composite indexes.",
      reveal: "(tenant_id, created_at): seek to the tenant, scan its range in order, and skip the sort.",
    },
    {
      id: "sql-3-offset-cost",
      prompt: "Page 5,000 of a feed is slow:\nSELECT * FROM posts\nORDER BY id\nLIMIT 20 OFFSET 100000;\nWhy is it slow?",
      options: [
        "The skipped 100,000 rows are still read, then discarded",
        "OFFSET disables every index on the table being paginated",
        "LIMIT makes the planner ignore the ORDER BY",
        "Large offsets bypass the shared buffer cache",
      ],
      hint: "To skip a row, the database first has to find it.",
      senior:
        "OFFSET does not seek. The executor produces and throws away every skipped row, so cost grows with page depth. Keyset pagination, WHERE id > last_seen_id, seeks straight to the page.",
      principle: "OFFSET cost",
      why: "Deep pagination is a common production slowdown with a well-known fix.",
      reveal: "The first 100,000 rows are still produced and discarded; use keyset pagination for deep pages.",
    },
  ]),
  ...ask(3, "integrity", [
    {
      id: "sql-3-lost-update",
      prompt:
        "Two sessions at READ COMMITTED each read stock = 10 for item 1, compute 9 in the app, and run UPDATE items SET stock = 9 WHERE id = 1. Two sales, but stock ends at 9. Simplest fix?",
      options: [
        "UPDATE items SET stock = stock - 1 WHERE id = 1",
        "Wrap the SELECT and the UPDATE in BEGIN ... COMMIT",
        "Add an index on items.id",
        "Read the row with SELECT ... LIMIT 1",
      ],
      hint: "Let the database do the arithmetic on the current value.",
      senior:
        "An UPDATE that computes from the column reads the latest committed value under its row lock, so concurrent decrements serialize. A transaction alone does not help at READ COMMITTED; SELECT ... FOR UPDATE also works.",
      principle: "Lost update",
      why: "Read-modify-write races cause oversold inventory and wrong balances.",
      reveal: "Make it atomic with SET stock = stock - 1: each UPDATE locks the row and decrements the latest value.",
    },
    {
      id: "sql-3-for-update",
      prompt: "What does SELECT ... FOR UPDATE do in PostgreSQL?",
      options: [
        "Locks the selected rows until the transaction ends",
        "Locks the whole table until the next COMMIT",
        "Re-runs the SELECT at COMMIT to check for changes",
        "Blocks plain SELECTs from reading those rows",
      ],
      hint: "Other writers wait; plain readers do not.",
      senior:
        "FOR UPDATE takes row-level locks on the returned rows, held until commit or rollback. Other UPDATEs, DELETEs, and locking reads of those rows wait; ordinary SELECTs still read through MVCC.",
      principle: "Row locking",
      why: "It is the standard tool for read-then-write logic that must not race.",
      reveal: "It locks the returned rows against concurrent writes and locking reads until the transaction ends.",
    },
    {
      id: "sql-3-mvcc-readers",
      prompt:
        "In PostgreSQL, session A has updated row 42 but not committed. Session B runs a plain SELECT of row 42. What happens?",
      options: [
        "B sees the last committed version immediately",
        "B blocks on A's row lock until A commits or rolls back",
        "B sees A's uncommitted new value",
        "B receives a serialization error",
      ],
      hint: "Readers do not block writers, and writers do not block readers.",
      senior:
        "MVCC keeps the old row version visible to other snapshots, so B reads it without waiting. Only conflicting writes or locking reads would wait for A.",
      principle: "MVCC",
      why: "MVCC is why PostgreSQL reads scale under write load, and it shapes every concurrency answer.",
      reveal: "B reads the previously committed version without waiting; MVCC keeps it visible.",
    },
    {
      id: "sql-3-3nf",
      prompt: "orders(order_id PRIMARY KEY, customer_id, customer_email). Which normal form does this violate?",
      options: [
        "Third: email depends on customer_id, not the key",
        "First: an email address holds two parts, user and domain",
        "Second: the key has only one column",
        "Second: email depends on part of the key",
      ],
      hint: "order_id determines customer_id, which determines the email.",
      senior:
        "customer_email depends on order_id only through customer_id, a transitive dependency that 3NF forbids. A single-column key has no partial dependencies, so 2NF holds.",
      principle: "Third normal form",
      why: "Spotting transitive dependencies prevents update anomalies in schemas you design.",
      reveal: "3NF: customer_email depends on the key only through customer_id. Store it on customers.",
    },
  ]),
];

const LEVEL_4: PathQuestion[] = [
  ...ask(4, "basics", [
    {
      id: "sql-4-between-ts",
      prompt:
        "created_at is a timestamp. A January report filters with:\nWHERE created_at BETWEEN '2026-01-01' AND '2026-01-31'\nWhat does it get wrong?",
      options: [
        "It misses January 31 after midnight",
        "It double-counts January 1",
        "It includes all of February 1",
        "Nothing; BETWEEN covers whole days",
      ],
      hint: "As a timestamp, '2026-01-31' means midnight at the start of that day.",
      senior:
        "The upper bound is 2026-01-31 00:00:00, and BETWEEN is inclusive, so nearly all of January 31 is excluded. Use created_at >= '2026-01-01' AND created_at < '2026-02-01'.",
      principle: "Half-open ranges",
      why: "Off-by-a-day report bugs come from inclusive bounds on continuous types.",
      reveal: "Everything after 00:00 on January 31 is missed. Use a half-open range ending before '2026-02-01'.",
    },
    {
      id: "sql-4-or-unknown",
      prompt: "A row has a = 1 and b = NULL. Which WHERE condition keeps it?",
      options: ["a = 1 OR b = 1", "a = 1 AND b <> 1", "NOT (b = 1)", "a = 1 AND NOT (b = 1)"],
      hint: "Work out TRUE OR unknown, and TRUE AND unknown.",
      senior:
        "In three-valued logic, TRUE OR UNKNOWN is TRUE, while TRUE AND UNKNOWN is UNKNOWN, and NOT UNKNOWN stays UNKNOWN. Only the OR evaluates to true.",
      principle: "Three-valued logic",
      why: "Reasoning precisely about unknown values separates careful SQL from lucky SQL.",
      reveal: "a = 1 OR b = 1: TRUE OR UNKNOWN is TRUE. Every other option evaluates to UNKNOWN.",
    },
    {
      id: "sql-4-collation",
      prompt:
        "ORDER BY name returns 'apple, Banana' in staging and 'Banana, apple' in production. Data and query are identical. Likely cause?",
      options: [
        "The databases use different collations",
        "ORDER BY on text is random without an index",
        "Production sorts large tables by insertion order",
        "The client driver re-sorts text results",
      ],
      hint: "Who decides whether uppercase sorts before lowercase?",
      senior:
        "Text ordering comes from the collation. 'C' compares bytes, so uppercase sorts first; linguistic collations such as en_US interleave case. Pin the collation when order matters.",
      principle: "Collation",
      why: "Environment-dependent sorting breaks tests, pagination, and comparisons on text.",
      reveal: "Different collations: C sorts uppercase before lowercase, while a linguistic collation does not.",
    },
    {
      id: "sql-4-limit-ties",
      prompt:
        "Paging a leaderboard with ORDER BY score DESC LIMIT 10 OFFSET n, some players show up on two pages and others on none. Fix?",
      options: [
        "Add a unique tiebreaker, such as id, to ORDER BY",
        "Add DISTINCT to the select list",
        "Raise LIMIT until each page covers every tied score",
        "Wrap the query in a transaction",
      ],
      hint: "Rows with equal scores have no defined order among themselves.",
      senior:
        "With ties, the order among equal scores is unspecified and can change between executions, so page boundaries shift. A unique trailing sort key makes the order total and pages stable.",
      principle: "Deterministic ordering",
      why: "Duplicate or missing items in infinite scroll usually trace back to this.",
      reveal: "Make the sort total: ORDER BY score DESC, id. Ties then keep a fixed order across pages.",
    },
  ]),
  ...ask(4, "joins", [
    {
      id: "sql-4-full-join-key",
      prompt:
        "Merging two daily metric tables:\nSELECT a.day, a.visits, b.signups\nFROM a FULL OUTER JOIN b ON a.day = b.day;\nDays that exist only in b show a NULL day. Fix?",
      options: [
        "Select COALESCE(a.day, b.day) as the day",
        "Change it to a LEFT JOIN from a to b, keeping a's days",
        "Add WHERE a.day IS NOT NULL",
        "Join ON a.day >= b.day instead",
      ],
      hint: "Either side may be the one that has the day.",
      senior:
        "In a full join, either side can be NULL-extended, so the key must come from whichever side exists. A LEFT JOIN or WHERE a.day IS NOT NULL discards b-only days entirely.",
      principle: "Full join keys",
      why: "Merging two time series is common, and the NULL key bug is easy to miss.",
      reveal: "Use COALESCE(a.day, b.day) so days found only in b keep their date.",
    },
    {
      id: "sql-4-lateral",
      prompt: "In PostgreSQL, what does LATERAL allow in FROM customers c, LATERAL (SELECT ...) o?",
      options: [
        "The subquery may reference c's columns",
        "The subquery runs in a parallel worker",
        "The join needs no condition at all",
        "The subquery result is cached per session",
      ],
      hint: "Ordinary subqueries in FROM cannot see their neighbors.",
      senior:
        "LATERAL lets a FROM item refer to columns of earlier FROM items, so it is evaluated per row. It is the clean way to write 'top 3 orders per customer' with ORDER BY ... LIMIT 3 inside.",
      principle: "LATERAL join",
      why: "LATERAL turns per-row top-N problems into simple, index-friendly queries.",
      reveal: "The subquery can reference columns of c and runs once per customer row, like a correlated join.",
    },
    {
      id: "sql-4-outer-then-inner",
      prompt:
        "SELECT c.name, p.name\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nJOIN products p ON p.id = o.product_id;\nWhy do customers without orders disappear?",
      options: [
        "The inner join rejects their NULL o.product_id",
        "The LEFT JOIN keeps only each customer's first order",
        "Joins after a LEFT JOIN run first",
        "PostgreSQL reorders LEFT JOINs to come last",
      ],
      hint: "What is o.product_id on a NULL-extended row?",
      senior:
        "The LEFT JOIN keeps order-less customers with o.product_id NULL, then the inner join needs p.id = NULL, which is never true. Make the second join LEFT too, or nest the inner join inside the outer one.",
      principle: "Join chains",
      why: "One inner join after an outer join silently undoes it, and grown queries do this often.",
      reveal: "The inner join to products needs a non-NULL o.product_id, so NULL-extended customers are dropped.",
    },
    {
      id: "sql-4-not-in-antijoin",
      prompt:
        "In PostgreSQL, NOT EXISTS (SELECT ...) is planned as an Anti Join, but col NOT IN (SELECT ...) usually is not. Why?",
      options: [
        "NOT IN must yield no rows if the subquery has a NULL",
        "NOT IN subqueries are always correlated",
        "Anti joins cannot use hash tables, which NOT IN needs",
        "NOT EXISTS runs its subquery once for the whole query",
      ],
      hint: "The two forms are not equivalent when NULLs exist.",
      senior:
        "An anti join keeps a row when no match exists. NOT IN differs: any NULL in the list makes it unknown. The planner cannot prove equivalence, so it uses a subplan, which can be far slower on large lists.",
      principle: "Anti-join semantics",
      why: "NOT EXISTS is both the correct and the faster default for anti-joins.",
      reveal: "Their NULL semantics differ, so NOT IN cannot become an anti join; NOT EXISTS can.",
    },
  ]),
  ...ask(4, "aggregation", [
    {
      id: "sql-4-empty-groups",
      prompt:
        "No row matches the filter in either query:\nA: SELECT SUM(total) FROM orders\n   WHERE false;\nB: SELECT customer_id, SUM(total) FROM orders\n   WHERE false GROUP BY customer_id;\nHow many rows does each query return?",
      options: [
        "A: one row with NULL. B: zero rows",
        "A: zero rows. B: zero rows",
        "A: one row with 0. B: one row with 0",
        "A: zero rows. B: one row with NULL",
      ],
      hint: "Without GROUP BY there is always exactly one group.",
      senior:
        "An aggregate without GROUP BY always returns one row, and SUM over no rows is NULL (COUNT would be 0). With GROUP BY, groups come from the data, and no rows means no groups.",
      principle: "Aggregates over empty input",
      why: "Code that expects exactly one row, or a zero total, breaks on empty input.",
      reveal: "A returns one row holding NULL; B returns no rows because there are no groups.",
    },
    {
      id: "sql-4-int-division",
      prompt: "qty is an integer column holding 1 and 2:\nSELECT SUM(qty) / COUNT(*) FROM items;\nWhat does this return in PostgreSQL?",
      options: ["1", "1.5", "2", "NULL"],
      hint: "What type does SUM of integers return, and what does integer division do?",
      senior:
        "SUM(integer) returns bigint and COUNT returns bigint, so 3 / 2 is integer division: 1. AVG(qty) returns numeric 1.5. Cast one side to numeric when you need a fraction.",
      principle: "Integer division",
      why: "Truncated ratios and percentages are a quiet, common reporting bug.",
      reveal: "1: bigint divided by bigint truncates. Use AVG(qty) or cast to numeric.",
    },
    {
      id: "sql-4-pct-of-total",
      prompt:
        "SELECT region,\n  SUM(total) * 100.0 / SUM(SUM(total)) OVER () AS pct\nFROM orders\nGROUP BY region;\nWhat does pct contain?",
      options: [
        "Each region's share of all revenue, in percent",
        "An error, because aggregate calls cannot be nested",
        "100 for every region",
        "A running percentage in region order",
      ],
      hint: "Window functions run after GROUP BY.",
      senior:
        "The inner SUM is the grouped total per region. The outer SUM(...) OVER () is a window over the grouped rows, giving the grand total. OVER () has no ORDER BY, so nothing accumulates.",
      principle: "Windows over aggregates",
      why: "Share-of-total is a common analytics ask, solved in one pass with this pattern.",
      reveal: "Each region's percentage of total revenue: the window SUM runs over the already grouped rows.",
    },
    {
      id: "sql-4-having-alias",
      prompt:
        "SELECT date_trunc('month', created_at) AS m,\n       COUNT(*) AS n\nFROM orders\nGROUP BY m\nHAVING n > 5\nORDER BY n;\nWhich part fails in PostgreSQL?",
      options: ["HAVING n > 5", "GROUP BY m", "ORDER BY n", "Nothing; it runs as written"],
      hint: "PostgreSQL accepts output names in some clauses, not all.",
      senior:
        "PostgreSQL resolves output column names in GROUP BY, as an extension, and in ORDER BY. HAVING, like WHERE, works on input columns and expressions, so n is unknown there. MySQL accepts it.",
      principle: "Alias scope",
      why: "Knowing exactly where aliases resolve avoids dialect surprises during migrations.",
      reveal: "HAVING n > 5 fails with column n does not exist; write HAVING COUNT(*) > 5.",
    },
  ]),
  ...ask(4, "advanced", [
    {
      id: "sql-4-cte-inline",
      prompt: "In PostgreSQL 12 or later, a non-recursive, side-effect-free CTE that is referenced once is:",
      options: [
        "Inlined, so outer filters can push into it",
        "Always materialized as an optimization fence",
        "Run once per row of the outer query",
        "Cached and reused by later statements",
      ],
      hint: "Before version 12, the answer was different.",
      senior:
        "Since PostgreSQL 12, such CTEs are inlined like subqueries. CTEs referenced more than once, recursive, or data-modifying are materialized by default. AS MATERIALIZED or NOT MATERIALIZED overrides it.",
      principle: "CTE inlining",
      why: "'CTEs are optimization fences' is outdated advice, and seniors know when it still applies.",
      reveal: "It is inlined into the outer query; AS MATERIALIZED forces the old fence behavior.",
    },
    {
      id: "sql-4-last-value",
      prompt:
        "Each sku has one row per day:\nSELECT sku, day,\n  LAST_VALUE(price) OVER (\n    PARTITION BY sku ORDER BY day\n  ) AS last_price\nFROM prices;\nWhat does last_price show?",
      options: [
        "The current row's own price",
        "The price on the final day in that sku's partition",
        "NULL, except on the partition's last row",
        "The price on that sku's first day",
      ],
      hint: "Where does the default frame end?",
      senior:
        "With ORDER BY, the default frame ends at the current row and its peers, so LAST_VALUE sees the current row. Add ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING, or use FIRST_VALUE with DESC.",
      principle: "Window frames",
      why: "LAST_VALUE returning the current row is a classic window function bug.",
      reveal: "The current row's price, because the default frame stops at the current row. Extend it to UNBOUNDED FOLLOWING.",
    },
    {
      id: "sql-4-recursive-cycle",
      prompt: "A recursive CTE with UNION ALL walks a follows(a, b) graph that contains cycles. Without extra handling it:",
      options: [
        "Loops until stopped or out of resources",
        "Visits each node once, then stops",
        "Fails to plan, because the graph contains a cycle",
        "Returns only the anchor rows",
      ],
      hint: "UNION ALL never discards a row it has seen before.",
      senior:
        "Each step keeps producing rows around the cycle, so the working table never empties. Track visited nodes in an array, use the CYCLE clause (PostgreSQL 14+), or cap the depth.",
      principle: "Cycles in recursion",
      why: "Graph walks over real data, like referrals or dependencies, often contain cycles.",
      reveal: "It never terminates on its own. Track visited nodes, use CYCLE, or cap the depth.",
    },
    {
      id: "sql-4-in-vs-exists",
      prompt:
        "In modern PostgreSQL, how do WHERE id IN (SELECT customer_id FROM orders) and the equivalent WHERE EXISTS compare?",
      options: [
        "Both usually plan as the same semi join",
        "EXISTS is always faster than IN",
        "IN runs its subquery once per outer row",
        "IN cannot use an index on the subquery",
      ],
      hint: "The planner rewrites both into a join.",
      senior:
        "PostgreSQL turns both IN (subquery) and EXISTS into semi joins and picks hash, merge, or nested loop by cost. The real difference is under negation: NOT IN versus NOT EXISTS with NULLs.",
      principle: "Semi joins",
      why: "Folk rules like 'EXISTS is faster' do not survive EXPLAIN, and interviewers check that you know it.",
      reveal: "They typically produce the same semi-join plan; choose on clarity and NULL semantics.",
    },
  ]),
  ...ask(4, "performance", [
    {
      id: "sql-4-expression-index",
      prompt: "Logins run WHERE lower(email) = lower($1), and users has an index on email. Which index lets the query seek?",
      options: [
        "CREATE INDEX ON users (lower(email))",
        "CREATE INDEX ON users (email DESC)",
        "CREATE INDEX ON users USING hash (email)",
        "CREATE INDEX ON users (email) INCLUDE (id)",
      ],
      hint: "The index must store what the query compares.",
      senior:
        "An expression index stores lower(email), and the planner matches it when the query uses the same expression. Direction, hash, or included columns do not change what is compared. citext is an alternative.",
      principle: "Expression index",
      why: "Case-insensitive lookups are a common sargability problem with a precise fix.",
      reveal: "An expression index on lower(email); the query's expression must match it exactly.",
    },
    {
      id: "sql-4-stale-stats",
      prompt:
        "After a bulk load of 10M rows, a query turns slow. EXPLAIN ANALYZE shows rows=10 estimated against 2,000,000 actual. First step?",
      options: [
        "Run ANALYZE on the table",
        "Add an index on every column",
        "Raise work_mem to the maximum",
        "Rewrite the query as a CTE",
      ],
      hint: "The planner's guess is off by five orders of magnitude.",
      senior:
        "Estimates come from table statistics, which autovacuum refreshes only after thresholds are met, so right after a bulk load they are stale. ANALYZE updates them and lets the planner choose again.",
      principle: "Planner statistics",
      why: "Bad estimates cause most bad plans, and refreshing statistics is the cheapest lever.",
      reveal: "Run ANALYZE: the statistics are stale, and the planner chose a plan meant for 10 rows.",
    },
    {
      id: "sql-4-explain-analyze-write",
      prompt: "You run EXPLAIN ANALYZE DELETE FROM sessions WHERE expires_at < now(); on production. What happens?",
      options: [
        "The DELETE executes; wrap it in BEGIN ... ROLLBACK",
        "Only estimates are shown; nothing is deleted",
        "It runs against a temporary copy of the sessions table",
        "PostgreSQL refuses ANALYZE on write statements",
      ],
      hint: "ANALYZE means it actually runs.",
      senior:
        "EXPLAIN ANALYZE executes the statement to measure it, side effects included. Run it in a transaction and roll back, remembering it still takes locks and does the I/O.",
      principle: "EXPLAIN ANALYZE",
      why: "Measuring a write on production without a rollback is a real outage story.",
      reveal: "The rows really are deleted. Use BEGIN; EXPLAIN ANALYZE ...; ROLLBACK;",
    },
    {
      id: "sql-4-keyset",
      prompt:
        "A feed sorts by created_at DESC, id DESC. The last row shown had (created_at, id) = ($1, $2). Which filter fetches the next page correctly?",
      options: [
        "WHERE (created_at, id) < ($1, $2)",
        "WHERE created_at < $1",
        "WHERE created_at <= $1 AND id < $2",
        "WHERE id < $2",
      ],
      hint: "Rows tied on created_at must still be split by id.",
      senior:
        "The row comparison means created_at < $1, or created_at = $1 and id < $2, matching the sort, and it can seek an index on (created_at, id). created_at < $1 skips ties; separate ANDs drop older rows with larger ids.",
      principle: "Keyset pagination",
      why: "Keyset pagination is the scalable answer to deep paging, and getting ties right is the hard part.",
      reveal: "The row-value comparison (created_at, id) < ($1, $2), with the same ORDER BY and a LIMIT.",
    },
  ]),
  ...ask(4, "integrity", [
    {
      id: "sql-4-pg-repeatable-read",
      prompt: "Which is true of REPEATABLE READ in PostgreSQL?",
      options: [
        "It prevents phantom reads but still allows write skew",
        "It prevents write skew but still allows phantom reads",
        "It allows non-repeatable reads but not phantom reads",
        "It behaves exactly like READ COMMITTED",
      ],
      hint: "PostgreSQL implements it as snapshot isolation.",
      senior:
        "PostgreSQL's REPEATABLE READ uses one snapshot for the whole transaction, so new rows never appear: no phantoms, stricter than the standard requires. Snapshot isolation still permits write skew.",
      principle: "Snapshot isolation",
      why: "Quoting the standard's table instead of PostgreSQL's real behavior is a common interview slip.",
      reveal: "It prevents phantoms, stricter than the standard, but allows write skew, which needs SERIALIZABLE.",
    },
    {
      id: "sql-4-rr-conflict",
      prompt:
        "T2 runs at REPEATABLE READ in PostgreSQL. After T2 took its snapshot, T1 updated row 7 and committed. Now T2 runs UPDATE ... WHERE id = 7. What happens?",
      options: [
        "T2 fails with a serialization error",
        "T2 silently overwrites T1's change",
        "T2 re-reads row 7 and applies its update",
        "T2 waits until T1's snapshot expires",
      ],
      hint: "Re-reading the new row version is what READ COMMITTED does.",
      senior:
        "At READ COMMITTED, PostgreSQL re-evaluates the updated row and continues. At REPEATABLE READ it cannot update a version newer than its snapshot, so it raises a serialization failure; the app must retry.",
      principle: "Serialization failure",
      why: "Higher isolation levels move work into retry logic, and interviewers want you to say so.",
      reveal: "T2 gets a serialization failure and must retry the whole transaction.",
    },
    {
      id: "sql-4-deadlock",
      prompt: "T1 updates account 1, then account 2. T2 concurrently updates account 2, then account 1. In PostgreSQL:",
      options: [
        "One transaction is aborted with a deadlock error",
        "Both wait forever unless a lock_timeout has been set",
        "Both succeed, since row locks are advisory",
        "The later UPDATE skips the locked row",
      ],
      hint: "Each holds the lock the other wants.",
      senior:
        "PostgreSQL's deadlock detector runs after deadlock_timeout and aborts one participant. Prevent it by locking rows in a consistent order, for example by ascending id.",
      principle: "Deadlock",
      why: "Deadlocks appear under load in transfer and batch code, and the fix is a design rule.",
      reveal: "PostgreSQL detects the cycle and aborts one transaction. Update rows in a consistent order.",
    },
    {
      id: "sql-4-denormalize",
      prompt:
        "You add customers.order_count, kept in sync on every order insert and delete. What is the main tradeoff?",
      options: [
        "Faster reads, but writes cost more and can drift",
        "Less storage, plus stronger integrity at no cost",
        "Fewer writes, since inserts no longer touch orders",
        "No tradeoff at all once a trigger maintains it",
      ],
      hint: "The count now lives in two places.",
      senior:
        "Denormalized counters make reads cheap, but every write must update them, often contending on one hot row, and any missed code path makes them drift. Triggers move that cost; they do not remove it.",
      principle: "Denormalization",
      why: "Every senior has shipped a counter that drifted; interviewers want the tradeoff named.",
      reveal: "Reads get cheaper, while every write must update the counter, which can contend and drift.",
    },
  ]),
];

const LEVEL_5: PathQuestion[] = [
  ...ask(5, "basics", [
    {
      id: "sql-5-and-order",
      prompt:
        "SELECT * FROM stats\nWHERE hits <> 0 AND total / hits > 10;\nIs this guaranteed never to divide by zero in PostgreSQL?",
      options: [
        "No; AND operands may run in any order. Use CASE",
        "Yes; AND short-circuits strictly left to right",
        "Yes; WHERE filters before any expression runs",
        "No, though it can only fail when the plan is parallel",
      ],
      hint: "SQL is declarative. Does it promise an evaluation order inside WHERE?",
      senior:
        "PostgreSQL does not guarantee the order in which AND or OR operands are evaluated; the planner may reorder them. To force order, use CASE WHEN hits <> 0 THEN total / hits > 10 END, or NULLIF.",
      principle: "Evaluation order",
      why: "Relying on short-circuiting produces errors that appear only when a plan changes.",
      reveal: "No: evaluation order is not guaranteed. Write total / NULLIF(hits, 0) > 10, or use CASE.",
    },
    {
      id: "sql-5-tz-date",
      prompt:
        "Two services run SELECT created_at::date AS day, COUNT(*) ... GROUP BY 1 on the same timestamptz column and report different daily counts. Most likely cause?",
      options: [
        "Their sessions use different TimeZone settings",
        "timestamptz stores each row's original zone",
        "COUNT(*) returns estimates on very large tables in PostgreSQL",
        "date casts round to the nearest midnight",
      ],
      hint: "A timestamptz is an instant. Which calendar day is that instant?",
      senior:
        "timestamptz stores an absolute instant, and casting it to date converts using the session's TimeZone. Rows near midnight fall on different days in different zones. Convert explicitly with AT TIME ZONE.",
      principle: "Time zones",
      why: "Daily metrics that disagree between services are a recurring production puzzle.",
      reveal: "The ::date cast uses each session's TimeZone. Convert explicitly, as in (created_at AT TIME ZONE 'UTC')::date.",
    },
    {
      id: "sql-5-change-detect",
      prompt: "An audit trigger logs a change only when OLD.email <> NEW.email. Which changes go unlogged?",
      options: [
        "Setting email to or from NULL",
        "Changing only the letter case",
        "Two changes in one transaction",
        "Changes made by a superuser",
      ],
      hint: "What does 'x' <> NULL evaluate to?",
      senior:
        "If either side is NULL, <> yields unknown, which the trigger treats as false. OLD.email IS DISTINCT FROM NEW.email treats NULL as a comparable value.",
      principle: "IS DISTINCT FROM",
      why: "Audit and sync jobs that miss NULL transitions corrupt downstream data quietly.",
      reveal: "Transitions to or from NULL, because <> returns unknown. Use IS DISTINCT FROM.",
    },
    {
      id: "sql-5-distinct-order",
      prompt: "SELECT DISTINCT customer_id\nFROM orders\nORDER BY created_at DESC;\nIn PostgreSQL, what happens when this runs?",
      options: [
        "Error: ORDER BY must appear in the select list",
        "Customers sorted by the time of their most recent order",
        "Customers ordered by their earliest order",
        "Customers in an arbitrary order",
      ],
      hint: "After DISTINCT, which created_at would a customer sort by?",
      senior:
        "With SELECT DISTINCT, one output row can stand for many inputs with different created_at values, so ORDER BY may only use selected expressions. Use GROUP BY customer_id ORDER BY MAX(created_at) DESC.",
      principle: "DISTINCT and ORDER BY",
      why: "Recognizing ill-defined queries, not just syntax errors, is a senior skill.",
      reveal: "An error: with SELECT DISTINCT, ORDER BY expressions must appear in the select list. Order by MAX(created_at).",
    },
  ]),
  ...ask(5, "joins", [
    {
      id: "sql-5-dashboard-doubled",
      prompt:
        "A deploy added JOIN shipments s ON s.order_id = o.id to the revenue query to show the carrier. Revenue for some days doubled. Most likely cause?",
      options: [
        "Split orders now count once per shipment",
        "Orders without shipments are now excluded",
        "The planner switched to a hash join",
        "SUM counts NULL carriers twice",
      ],
      hint: "Can one order have more than one shipment?",
      senior:
        "orders to shipments is one-to-many, so each split order's total repeats per shipment. Join methods never change results. Reduce shipments to one row per order first, or pick one with LATERAL ... LIMIT 1.",
      principle: "Join cardinality",
      why: "Metric regressions after an innocent-looking join are a classic senior debugging story.",
      reveal: "Fan-out: orders with several shipments are summed once per shipment. Reduce shipments to one row per order first.",
    },
    {
      id: "sql-5-nested-loop",
      prompt:
        "EXPLAIN ANALYZE shows a Nested Loop whose outer side was estimated at 1 row but returned 500,000; the inner index scan ran 500,000 times. Best reading?",
      options: [
        "A row misestimate led the planner to a nested loop",
        "Nested loops cannot use indexes on their inner side at all",
        "Hash joins are always faster, so this is a bug",
        "Join order is fixed by the order of FROM items",
      ],
      hint: "Nested loops are great for few outer rows. How many did the planner expect?",
      senior:
        "The planner chose a nested loop expecting one outer row; with 500,000, a hash or merge join would be far cheaper. Fix the estimate with ANALYZE, extended statistics for correlated columns, or a rewrite.",
      principle: "Join algorithms",
      why: "Senior engineers diagnose plans from estimates versus actuals, not from join names.",
      reveal: "A 500,000x misestimate made a one-row strategy run half a million probes. Fix the estimate.",
    },
    {
      id: "sql-5-asof",
      prompt:
        "For each trade, you need the latest price at or before the trade time for its symbol. prices is large and indexed on (symbol, ts). Best approach?",
      options: [
        "LATERAL subquery: ts <= trade ts, ORDER BY ts DESC LIMIT 1",
        "JOIN every price with p.ts <= t.ts, then GROUP BY trade and keep MAX(p.ts)",
        "JOIN prices ON p.symbol = t.symbol AND p.ts = t.ts exactly",
        "FULL OUTER JOIN prices on symbol, then filter rows by ts",
      ],
      hint: "Per trade you want one row, found by seeking backward in the index.",
      senior:
        "LATERAL with p.symbol = t.symbol AND p.ts <= t.ts ORDER BY p.ts DESC LIMIT 1 is one backward index seek per trade. The range join plus GROUP BY builds every earlier price for every trade. Equality misses most trades.",
      principle: "As-of join",
      why: "Point-in-time lookups for prices, exchange rates, or configs are a common senior data problem.",
      reveal: "A LATERAL subquery that seeks the index backward and takes LIMIT 1 per trade.",
    },
    {
      id: "sql-5-exists-vs-distinct",
      prompt:
        "SELECT DISTINCT c.*\nFROM customers c\nJOIN orders o ON o.customer_id = c.id;\nWhy do seniors prefer EXISTS over this?",
      options: [
        "The join fans out rows that DISTINCT must then remove",
        "DISTINCT returns wrong rows when customer ids repeat",
        "EXISTS takes fewer row locks than a join at READ COMMITTED",
        "The join cannot use an index on orders.customer_id",
      ],
      hint: "Count the rows produced before DISTINCT runs.",
      senior:
        "The join yields a row per order, then DISTINCT sorts or hashes wide rows to remove duplicates, and it even fails on types without equality, such as json. EXISTS is a semi-join that never makes the duplicates.",
      principle: "Semi-join vs DISTINCT",
      why: "Reaching for DISTINCT to hide fan-out is a code review smell.",
      reveal: "The join multiplies rows only for DISTINCT to remove them; EXISTS never creates the duplicates.",
    },
  ]),
  ...ask(5, "aggregation", [
    {
      id: "sql-5-p95",
      prompt: "You need p95 latency per endpoint in PostgreSQL. Which expression is right?",
      options: [
        "percentile_cont(0.95) WITHIN GROUP (ORDER BY ms)",
        "AVG(ms) + 1.645 * stddev_samp(ms) per endpoint",
        "MAX(ms) * 0.95",
        "NTILE(100) OVER (PARTITION BY endpoint ORDER BY ms) = 95",
      ],
      hint: "Latency is skewed. You want an ordered-set aggregate, not a formula.",
      senior:
        "percentile_cont is an ordered-set aggregate that interpolates the 95th percentile within each group. Mean plus deviations assumes a normal distribution, which latency is not. NTILE labels rows; it does not aggregate.",
      principle: "Percentiles",
      why: "SLOs are written in percentiles, and averages hide tail latency.",
      reveal: "percentile_cont(0.95) WITHIN GROUP (ORDER BY ms), grouped by endpoint; percentile_disc returns a real sample.",
    },
    {
      id: "sql-5-avg-of-avgs",
      prompt:
        "Region A has 1 order of 100. Region B has 3 orders of 20 each. A dashboard averages the two per-region averages. What does it show, and what is the true average order value?",
      options: [
        "It shows 60; the true value is 40",
        "It shows 40; the true value is 60",
        "Both are 40",
        "Both are 60",
      ],
      hint: "Total revenue divided by total orders.",
      senior:
        "The per-region averages are 100 and 20, so their mean is 60. The true average is 160 / 4 = 40. Averaging averages weights each group equally; compute from raw rows or weight by counts.",
      principle: "Averages of averages",
      why: "Pre-aggregated rollups make this mistake easy, and it skews executive dashboards.",
      reveal: "60 versus 40: averaging averages ignores group sizes. Divide total revenue by total orders.",
    },
    {
      id: "sql-5-distinct-rollup",
      prompt:
        "A rollup table stores COUNT(DISTINCT user_id) per day. Can monthly active users be computed by summing the 30 daily values?",
      options: [
        "No; users active on several days count repeatedly",
        "Yes; distinct counts add up across disjoint days",
        "Yes, as long as each day was bucketed in UTC first",
        "No; SUM cannot be applied to bigint counts",
      ],
      hint: "Is a user who logs in on Monday and Tuesday one user or two?",
      senior:
        "Distinct counts are not additive: the union of daily sets is smaller than the sum of their sizes. Keep raw (user_id, day) pairs, or a mergeable sketch such as HyperLogLog for approximate rollups.",
      principle: "Non-additive metrics",
      why: "Designing rollups for distinct metrics is a common senior analytics question.",
      reveal: "No: summing daily distinct counts double-counts returning users. Store ids or a mergeable sketch.",
    },
    {
      id: "sql-5-rollup",
      prompt: "Which groupings does GROUP BY ROLLUP (region, product) produce?",
      options: [
        "(region, product), (region), and the grand total",
        "(region, product), (region), (product), and no total",
        "Only (region, product), sorted by region",
        "Every subset, including (product) alone",
      ],
      hint: "ROLLUP drops columns from the right, one at a time.",
      senior:
        "ROLLUP (a, b) means GROUPING SETS ((a, b), (a), ()). CUBE would add (b). Subtotal rows show NULL in rolled-up columns; GROUPING() tells them apart from real NULLs.",
      principle: "ROLLUP",
      why: "Subtotals in one pass are a common reporting ask and a test of grouping-set fluency.",
      reveal: "Per region and product, per region, and one grand total row; GROUPING() marks the subtotal rows.",
    },
  ]),
  ...ask(5, "advanced", [
    {
      id: "sql-5-gaps-islands",
      prompt:
        "logins(user_id, day) has one row per user per active day:\nSELECT user_id, day,\n  day - ROW_NUMBER() OVER (\n    PARTITION BY user_id ORDER BY day\n  )::int AS grp\nFROM logins;\nWhat does grp identify?",
      options: [
        "Each streak of consecutive days; grp is constant in it",
        "Each user's very first login day, repeated on every row",
        "The number of days since that user's previous login",
        "Days that duplicate another login",
      ],
      hint: "Within a streak, day and row number both rise by exactly one.",
      senior:
        "In a run of consecutive days, day and ROW_NUMBER both rise by 1, so their difference is constant, and a gap changes it. Group by (user_id, grp) to get each streak's start, end, and length.",
      principle: "Gaps and islands",
      why: "Streaks, sessions, and outage windows are all gaps-and-islands problems.",
      reveal: "Each run of consecutive active days: the date minus the row number stays fixed inside a streak.",
    },
    {
      id: "sql-5-rows-vs-range",
      prompt:
        "daily_sales skips days with no sales. This is meant as a 7-day moving average:\nAVG(amount) OVER (\n  ORDER BY day\n  ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\n)\nWhat is wrong with it?",
      options: [
        "It spans 7 rows, which can be more than 7 days",
        "AVG is not allowed as a window function with a frame",
        "It includes the 6 days after the current row",
        "The frame needs UNBOUNDED PRECEDING to work",
      ],
      hint: "ROWS counts rows. What if a day has no row?",
      senior:
        "ROWS frames count physical rows, so missing days stretch the window back in time. Use RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW, or fill the gaps with generate_series.",
      principle: "ROWS vs RANGE",
      why: "Time-window metrics over sparse data go wrong in ways dashboards hide.",
      reveal: "ROWS counts 7 rows, not 7 days. Use a RANGE frame with an interval, or fill missing days first.",
    },
    {
      id: "sql-5-latest-per-group-scale",
      prompt:
        "orders has 500M rows for 10k customers and an index on (customer_id, created_at DESC). Fastest way to get each customer's latest order?",
      options: [
        "LATERAL per customer: ORDER BY created_at DESC LIMIT 1",
        "ROW_NUMBER() over all 500M orders, then keep rn = 1",
        "GROUP BY customer_id for MAX(created_at), then join back",
        "DISTINCT ON (customer_id) across the whole orders table",
      ],
      hint: "10k index seeks, or 500M rows read?",
      senior:
        "With few groups and many rows each, driving from customers with one index seek apiece touches about 10k entries. ROW_NUMBER, DISTINCT ON, and GROUP BY read every order. Many tiny groups would flip it.",
      principle: "Top-1 per group at scale",
      why: "Choosing a strategy from group cardinality is exactly the tradeoff senior interviews probe.",
      reveal: "Drive from customers with LATERAL and LIMIT 1, so each customer costs one index seek.",
    },
    {
      id: "sql-5-dml-cte",
      prompt:
        "queue has 5 rows with ready = true:\nWITH moved AS (\n  DELETE FROM queue WHERE ready RETURNING *\n)\nSELECT\n  (SELECT count(*) FROM queue WHERE ready) AS left_over,\n  (SELECT count(*) FROM moved) AS taken;\nIn PostgreSQL, what does this return?",
      options: ["left_over 5, taken 5", "left_over 0, taken 5", "left_over 5, taken 0", "left_over 0, taken 0"],
      hint: "Every part of one statement shares a snapshot.",
      senior:
        "Sub-statements in WITH run with the same snapshot as the main query, so the main query cannot see the DELETE's effect on queue; changed rows are visible only through RETURNING. The DELETE still happens.",
      principle: "Data-modifying CTEs",
      why: "Writable CTEs enable atomic move-and-archive, and their snapshot rules surprise people.",
      reveal: "left_over 5, taken 5: the main query reads the pre-DELETE snapshot, and moved exposes the deleted rows.",
    },
  ]),
  ...ask(5, "performance", [
    {
      id: "sql-5-heap-fetches",
      prompt: "EXPLAIN ANALYZE shows Index Only Scan ... Heap Fetches: 900000 on a heavily updated table. What is going on?",
      options: [
        "Pages are not all-visible; VACUUM needs to catch up",
        "The index lacks a column, so every row hits the table",
        "Index-only scans always fetch every heap row",
        "The query has too many bound parameters",
      ],
      hint: "How does PostgreSQL know an index entry is visible without checking the table?",
      senior:
        "Index-only scans skip the heap only for pages marked all-visible in the visibility map, which VACUUM sets and updates clear. Tune autovacuum for the table. A missing column would rule out the index-only scan.",
      principle: "Visibility map",
      why: "Covering indexes that do not deliver are a classic senior-level PostgreSQL puzzle.",
      reveal: "The visibility map is stale, so rows are checked in the heap. Make VACUUM run more aggressively.",
    },
    {
      id: "sql-5-generic-plan",
      prompt:
        "A prepared statement filtering by tenant_id is fast for a while, then becomes slow for the one huge tenant only. PostgreSQL default settings. Likely cause?",
      options: [
        "After 5 runs it may switch to a generic plan",
        "The plan cache expires after five executions",
        "Prepared statements cannot use index scans",
        "The huge tenant's rows sit on slower disks",
      ],
      hint: "Plans built for specific values versus plans built for any value.",
      senior:
        "PostgreSQL plans the first five executions with the real parameters, then may switch to a generic plan that ignores skew. plan_cache_mode = force_custom_plan, or separate handling for huge tenants, fixes it.",
      principle: "Generic vs custom plans",
      why: "Skewed multi-tenant data makes parameter-sensitive plans a real production issue.",
      reveal: "After five custom plans PostgreSQL may switch to a generic plan that ignores the huge tenant's skew.",
    },
    {
      id: "sql-5-partial-index",
      prompt:
        "jobs has 100M rows; about 1,000 are pending. Workers run WHERE status = 'pending' ORDER BY created_at LIMIT 10. Which CREATE INDEX ON jobs fits best?",
      options: [
        "(created_at) WHERE status = 'pending'",
        "(status) INCLUDE (created_at, payload)",
        "(created_at, status) on the full table",
        "USING hash (status) on the full table",
      ],
      hint: "Only a tiny slice of the table ever matters to this query.",
      senior:
        "A partial index holds only pending rows, so it stays tiny, skips maintenance for other rows, and is already ordered by created_at for the LIMIT. (status, created_at) also works but indexes 100M idle rows.",
      principle: "Partial index",
      why: "Queue tables are a common design question, and partial indexes are the senior answer.",
      reveal: "A partial index on created_at WHERE status = 'pending': tiny, ordered, and exactly the query's slice.",
    },
    {
      id: "sql-5-correlated-columns",
      prompt:
        "WHERE city = 'Oslo' AND country = 'NO' is estimated at 40 rows but returns 40,000. Statistics are fresh. Likely cause and fix?",
      options: [
        "Correlated columns; add CREATE STATISTICS on them",
        "The index on city is corrupt; REINDEX it right away",
        "Text columns cannot be estimated; use enums",
        "The planner assumes one row for AND filters",
      ],
      hint: "The planner multiplies the two selectivities as if they were independent.",
      senior:
        "Without extended statistics, PostgreSQL assumes predicates are independent and multiplies selectivities, but every Oslo row is Norwegian. CREATE STATISTICS on (city, country), then ANALYZE, teaches it.",
      principle: "Extended statistics",
      why: "Correlated predicates cause bad join choices, and the fix is little known.",
      reveal: "The planner assumed independence. Create extended statistics on (city, country) and re-analyze.",
    },
  ]),
  ...ask(5, "integrity", [
    {
      id: "sql-5-write-skew",
      prompt:
        "Rule: at least one doctor stays on call. Two on-call doctors each, at REPEATABLE READ in PostgreSQL, count on-call doctors (2), then set themselves off call. Both commit. What prevents this?",
      options: [
        "SERIALIZABLE, with the app retrying failures",
        "A CHECK constraint on the on_call column",
        "Dropping to READ COMMITTED for fresher reads",
        "A B-tree index on the on_call column",
      ],
      hint: "Each transaction updated a different row, so no write conflict occurred.",
      senior:
        "This is write skew: both read an overlapping set, then wrote disjoint rows, which snapshot isolation does not detect. SERIALIZABLE detects the dependency and aborts one. Locking the rows read also works.",
      principle: "Write skew",
      why: "Write skew separates candidates who memorized the isolation table from those who understand it.",
      reveal: "Run at SERIALIZABLE and retry on serialization failure, or explicitly lock the rows the check reads.",
    },
    {
      id: "sql-5-skip-locked",
      prompt:
        "Twenty workers each run SELECT * FROM jobs WHERE status = 'pending' ORDER BY id LIMIT 1, plus a locking clause. Which clause lets each claim a different job without waiting?",
      options: ["FOR UPDATE SKIP LOCKED", "FOR UPDATE", "FOR UPDATE NOWAIT", "FOR KEY SHARE SKIP LOCKED"],
      hint: "Workers should neither queue behind each other nor share a job.",
      senior:
        "FOR UPDATE alone makes every worker wait on the first row, and NOWAIT errors instead of moving on. Share locks do not conflict with each other, so two workers could take one job. SKIP LOCKED passes held rows.",
      principle: "SKIP LOCKED queues",
      why: "Postgres-backed job queues are common, and this clause is what makes them scale.",
      reveal: "FOR UPDATE SKIP LOCKED: each worker locks a row no one else holds and skips the rest.",
    },
    {
      id: "sql-5-create-index-concurrently",
      prompt: "You must add an index to a busy 1 TB orders table in PostgreSQL without blocking writes. What do you run?",
      options: [
        "CREATE INDEX CONCURRENTLY, then confirm it is valid",
        "CREATE INDEX inside one transaction so it can roll back",
        "Plain CREATE INDEX; it only blocks reads",
        "REINDEX TABLE orders during off-peak hours",
      ],
      hint: "A plain CREATE INDEX takes a lock that blocks INSERT, UPDATE, and DELETE.",
      senior:
        "CONCURRENTLY builds the index without blocking writes. It is slower, cannot run inside a transaction block, and a failure leaves an INVALID index to drop and retry. Plain CREATE INDEX blocks writes, not reads.",
      principle: "Online index builds",
      why: "Schema changes on hot tables are a core senior operational skill.",
      reveal: "CREATE INDEX CONCURRENTLY outside a transaction, then check it was not left INVALID.",
    },
    {
      id: "sql-5-fk-index",
      prompt:
        "Deleting one row from customers takes seconds and holds locks. orders.customer_id REFERENCES customers(id). Most likely cause?",
      options: [
        "orders.customer_id has no index, so each check scans orders",
        "Foreign keys lock the entire customers table on any delete",
        "The automatic index PostgreSQL adds to every FK column is bloated",
        "ON DELETE NO ACTION defers checks to a nightly job",
      ],
      hint: "PostgreSQL indexes the referenced key. What about the referencing column?",
      senior:
        "PostgreSQL requires a unique index on the referenced column but never creates one on the referencing column. Each delete or key update on customers must find matching orders: a full scan without an index.",
      principle: "Indexing foreign keys",
      why: "Unindexed foreign keys are a classic cause of slow deletes and lock pileups.",
      reveal: "No index on orders.customer_id, so each delete scans orders to check references. Add that index.",
    },
  ]),
];

const PUZZLES: PathPuzzle[] = [
  {
    id: "sql-1-logical-order",
    level: 1,
    seat: "basics",
    kind: "pipeline",
    label: "Clause order",
    prompt: "Put the clauses in the order PostgreSQL logically evaluates a SELECT, not the order you write them.",
    stages: ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY"],
    hint: "You cannot filter rows you have not fetched, or sort by columns you have not computed.",
    senior:
      "FROM and its joins produce rows, WHERE filters them, GROUP BY forms groups, HAVING filters groups, SELECT computes outputs, and ORDER BY sorts last, which is why it can use aliases.",
    principle: "Logical processing order",
    why: "This order explains why WHERE cannot see aliases and why HAVING exists.",
    reveal: "FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY. LIMIT and OFFSET apply after all of them.",
  },
  {
    id: "sql-1-join-keeps",
    level: 1,
    seat: "joins",
    kind: "context",
    label: "Join types",
    prompt: "Sort each join by whether it can return a row that has no match on the other side.",
    groups: ["Keeps unmatched rows", "Matched pairs only"],
    items: [
      { id: "left", label: "LEFT JOIN", group: "Keeps unmatched rows" },
      { id: "right", label: "RIGHT JOIN", group: "Keeps unmatched rows" },
      { id: "full", label: "FULL OUTER JOIN", group: "Keeps unmatched rows" },
      { id: "inner", label: "INNER JOIN", group: "Matched pairs only" },
      { id: "using", label: "JOIN ... USING (id)", group: "Matched pairs only" },
      { id: "natural", label: "NATURAL JOIN", group: "Matched pairs only" },
    ],
    hint: "The word OUTER is optional; the words LEFT, RIGHT, and FULL are not.",
    senior:
      "LEFT, RIGHT, and FULL are outer joins and NULL-extend missing matches. A plain JOIN is an inner join whether written with ON, USING, or NATURAL.",
    principle: "Outer vs inner joins",
    why: "Most join bugs are a join of the wrong kind.",
    reveal: "LEFT, RIGHT, and FULL keep unmatched rows; INNER, USING, and NATURAL joins return matched pairs only.",
  },
  {
    id: "sql-1-null-aggregates",
    level: 1,
    seat: "aggregation",
    kind: "latency",
    label: "NULL in aggregates",
    prompt: "The column amount contains some NULLs. Mark each aggregate that ignores the NULL rows.",
    marks: ["Ignores NULLs", "Counts every row"],
    items: [
      { id: "count-star", label: "COUNT(*)", onPath: false },
      { id: "count-col", label: "COUNT(amount)", onPath: true },
      { id: "sum", label: "SUM(amount)", onPath: true },
      { id: "avg", label: "AVG(amount)", onPath: true },
      { id: "max", label: "MAX(amount)", onPath: true },
    ],
    hint: "Only one of these looks at rows rather than values.",
    senior: "COUNT(*) counts rows. Every aggregate that takes an expression, COUNT(amount) included, skips NULL inputs.",
    principle: "Aggregates and NULL",
    why: "It explains why AVG(amount) and SUM(amount) / COUNT(*) can disagree.",
    reveal: "COUNT(amount), SUM, AVG, and MAX ignore NULLs; only COUNT(*) counts every row.",
  },
  {
    id: "sql-2-top-n-ties",
    level: 2,
    seat: "advanced",
    kind: "box",
    label: "Pick the window",
    prompt:
      "Return exactly 3 orders per customer, most recent first, even when two orders share a timestamp. Which function do you filter on?",
    cards: [
      { id: "row", label: "ROW_NUMBER()", detail: "1, 2, 3, 4 within each partition; tied rows get distinct numbers" },
      { id: "rank", label: "RANK()", detail: "Tied rows share a number, and the next number skips ahead" },
      { id: "dense", label: "DENSE_RANK()", detail: "Tied rows share a number, and no gaps follow" },
      { id: "ntile", label: "NTILE(3)", detail: "Splits each partition into 3 buckets of near-equal size" },
    ],
    answer: "row",
    hint: "Ties must not let a fourth row in.",
    senior:
      "Filtering rn <= 3 on ROW_NUMBER always yields at most 3 rows. RANK and DENSE_RANK can return more when ties straddle the cutoff, and NTILE makes buckets, not positions. Add id to ORDER BY for a stable pick.",
    principle: "Top-N per group",
    why: "Choosing between ranking functions turns a correct-looking query into an exact one.",
    reveal: "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC, id DESC), keeping rn <= 3.",
  },
  {
    id: "sql-2-sargable",
    level: 2,
    seat: "performance",
    kind: "latency",
    label: "Sargable?",
    prompt: "orders has a B-tree index on created_at. Mark each filter that can use the index to seek.",
    marks: ["Can seek the index", "Cannot seek"],
    items: [
      { id: "now", label: "created_at >= now() - interval '1 day'", onPath: true },
      { id: "between", label: "created_at BETWEEN $1 AND $2", onPath: true },
      { id: "equal", label: "created_at = $1", onPath: true },
      { id: "trunc", label: "date_trunc('day', created_at) = $1", onPath: false },
      { id: "plus", label: "created_at + interval '1 day' > now()", onPath: false },
      { id: "extract", label: "extract(year FROM created_at) = 2026", onPath: false },
    ],
    hint: "Can the filter be answered by walking a list sorted by created_at alone?",
    senior:
      "Anything that leaves created_at bare and compares it with a value fixed for the statement can seek; now() is stable within a statement. Wrapping or adding to the column forces per-row evaluation.",
    principle: "Sargability",
    why: "Rewriting filters to be sargable is often the cheapest performance fix available.",
    reveal: "Bare-column comparisons seek; date_trunc, arithmetic on the column, and extract do not without an expression index.",
  },
  {
    id: "sql-2-where-or-having",
    level: 2,
    seat: "aggregation",
    kind: "context",
    label: "WHERE or HAVING",
    prompt: "A report groups orders by customer_id. Sort each filter into the clause where it belongs.",
    groups: ["WHERE", "HAVING"],
    items: [
      { id: "status", label: "status = 'paid'", group: "WHERE" },
      { id: "date", label: "created_at >= '2026-01-01'", group: "WHERE" },
      { id: "positive", label: "total > 0", group: "WHERE" },
      { id: "count", label: "COUNT(*) > 5", group: "HAVING" },
      { id: "sum", label: "SUM(total) >= 1000", group: "HAVING" },
      { id: "avg", label: "AVG(total) < 20", group: "HAVING" },
    ],
    hint: "Does the filter need the group to exist first?",
    senior:
      "Row-level conditions go in WHERE so fewer rows reach the grouping step. Conditions on aggregates can only go in HAVING.",
    principle: "WHERE vs HAVING",
    why: "Placing filters correctly is both a correctness and a performance habit.",
    reveal: "status, created_at, and total > 0 filter rows in WHERE; the COUNT, SUM, and AVG conditions go in HAVING.",
  },
  {
    id: "sql-3-recursive-steps",
    level: 3,
    seat: "advanced",
    kind: "pipeline",
    label: "Recursive CTE",
    prompt: "Order the steps PostgreSQL follows to evaluate a WITH RECURSIVE query that uses UNION ALL.",
    stages: [
      "Run the anchor (non-recursive) term",
      "Use its rows as the working table",
      "Run the recursive term on the working table",
      "Make its new rows the next working table",
      "Stop when the recursive term returns no rows",
    ],
    hint: "The anchor runs once; the recursive part runs repeatedly.",
    senior:
      "The anchor seeds both the result and the working table. Each iteration runs the recursive term against only the previous iteration's rows, appends them to the result, and repeats until an iteration is empty.",
    principle: "Recursive CTE evaluation",
    why: "Knowing the iteration model explains why recursive CTEs need a termination condition.",
    reveal: "Anchor, seed the working table, run the recursive term, replace the working table, stop on an empty step.",
  },
  {
    id: "sql-3-outer-filter",
    level: 3,
    seat: "joins",
    kind: "context",
    label: "ON or WHERE",
    prompt:
      "Base query: customers c LEFT JOIN orders o ON o.customer_id = c.id. Sort each extra condition by its effect on the customers returned.",
    groups: ["Every customer survives", "Some customers can vanish"],
    items: [
      { id: "on-order", label: "ON ... AND o.total > 100", group: "Every customer survives" },
      { id: "on-customer", label: "ON ... AND c.active", group: "Every customer survives" },
      { id: "where-order", label: "WHERE o.total > 100", group: "Some customers can vanish" },
      { id: "where-customer", label: "WHERE c.active", group: "Some customers can vanish" },
      { id: "where-or", label: "WHERE o.total > 100 OR o.id IS NULL", group: "Some customers can vanish" },
    ],
    hint: "ON shapes the matches. WHERE removes finished rows.",
    senior:
      "Conditions in a LEFT JOIN's ON clause only decide which orders match; every customer still appears, even when the condition is about c. The OR o.id IS NULL form still drops customers whose orders all fail the test.",
    principle: "ON vs WHERE",
    why: "This distinction is behind many 'missing rows' bugs in reports.",
    reveal: "Conditions in ON keep every customer; any WHERE condition can remove some, including the OR IS NULL variant.",
  },
  {
    id: "sql-3-oversell",
    level: 3,
    seat: "integrity",
    kind: "box",
    label: "Last ticket",
    prompt:
      "One ticket is left and two buyers click at once. The app runs at READ COMMITTED. Which approach sells it exactly once?",
    cards: [
      {
        id: "cond",
        label: "Conditional UPDATE",
        detail: "UPDATE ... SET left = left - 1 WHERE id = $1 AND left > 0, then check the row count",
      },
      { id: "check", label: "Check, then write", detail: "SELECT left; if it is above 0, run UPDATE ... SET left = left - 1" },
      { id: "index", label: "Index the column", detail: "Add a B-tree index on tickets(left)" },
      { id: "poll", label: "Poll and retry", detail: "Re-read left in a loop until it shows above 0, then write" },
    ],
    answer: "cond",
    hint: "The check and the write must be one atomic step.",
    senior:
      "The conditional UPDATE locks the row; the second buyer waits, then PostgreSQL re-checks left > 0 on the new version and updates zero rows. Check-then-write lets both pass the check. CHECK (left >= 0) adds a safety net.",
    principle: "Atomic conditional update",
    why: "Overselling is a classic concurrency bug in commerce interviews.",
    reveal: "The conditional UPDATE: the second buyer's re-check sees left = 0 and updates no rows, so it reports sold out.",
  },
  {
    id: "sql-4-slow-query",
    level: 4,
    seat: "performance",
    kind: "pipeline",
    label: "Slow query triage",
    prompt: "A query regressed in production. Put the investigation in a sensible order.",
    stages: [
      "Capture the exact query and its parameters",
      "Run EXPLAIN (ANALYZE, BUFFERS) on it",
      "Compare estimated and actual row counts",
      "Fix the cause: stats, index, or rewrite",
      "Re-run and confirm the plan changed",
    ],
    hint: "Measure before you change anything.",
    senior:
      "Parameters matter because plans depend on values. EXPLAIN ANALYZE shows where time goes, and the first node where estimates and actuals diverge usually points at the cause. Verify after the fix.",
    principle: "Plan-driven tuning",
    why: "Interviewers want a method, not a favorite index.",
    reveal: "Capture, run EXPLAIN ANALYZE, compare estimates with actuals, fix the cause, then verify.",
  },
  {
    id: "sql-4-read-committed-anomalies",
    level: 4,
    seat: "integrity",
    kind: "latency",
    label: "READ COMMITTED",
    prompt: "Mark each anomaly that can occur under PostgreSQL's default READ COMMITTED isolation.",
    marks: ["Can occur", "Prevented"],
    items: [
      { id: "dirty", label: "Dirty read", onPath: false },
      { id: "nonrepeatable", label: "Non-repeatable read", onPath: true },
      { id: "phantom", label: "Phantom read", onPath: true },
      { id: "lost", label: "Lost update (read, then write)", onPath: true },
      { id: "skew", label: "Write skew", onPath: true },
      { id: "rolled-back", label: "Reading a rolled-back value", onPath: false },
    ],
    hint: "Each statement sees a fresh snapshot of committed data, and nothing more.",
    senior:
      "READ COMMITTED never shows uncommitted or rolled-back data. But a later statement can see newly committed changes and rows, and app-level read-modify-write cycles can lose updates or skew.",
    principle: "Isolation anomalies",
    why: "Knowing what the default allows tells you where your code needs locks.",
    reveal: "Only dirty reads, including reads of rolled-back data, are prevented; the other anomalies can occur.",
  },
  {
    id: "sql-4-cte-materialize",
    level: 4,
    seat: "advanced",
    kind: "context",
    label: "CTE fence",
    prompt: "PostgreSQL 12 or later, default settings. Sort each CTE by how the planner treats it.",
    groups: ["Inlined", "Materialized"],
    items: [
      { id: "once", label: "Non-recursive, used once, pure", group: "Inlined" },
      { id: "not-mat", label: "NOT MATERIALIZED, used twice", group: "Inlined" },
      { id: "twice", label: "Referenced twice in the query", group: "Materialized" },
      { id: "mat", label: "Declared AS MATERIALIZED", group: "Materialized" },
      { id: "recursive", label: "WITH RECURSIVE", group: "Materialized" },
      { id: "dml", label: "Contains INSERT ... RETURNING", group: "Materialized" },
      { id: "volatile", label: "Calls a volatile function like random()", group: "Materialized" },
    ],
    hint: "Inlining is only safe when evaluating the query once or many times gives the same result.",
    senior:
      "Since PostgreSQL 12, a CTE is inlined when it is non-recursive, side-effect free, has no volatile functions, and is referenced once, or when NOT MATERIALIZED says so. Otherwise it is computed once and stored.",
    principle: "CTE materialization",
    why: "Whether a CTE is a fence decides whether filters push down, which can change a plan by orders of magnitude.",
    reveal: "Single-use pure CTEs and NOT MATERIALIZED ones are inlined; the rest are computed once and stored.",
  },
  {
    id: "sql-5-idempotent-insert",
    level: 5,
    seat: "integrity",
    kind: "box",
    label: "Exactly once",
    prompt:
      "Clients retry payment requests on timeout, and several app servers handle them. Which design records each payment exactly once?",
    cards: [
      {
        id: "unique",
        label: "Unique idempotency key",
        detail: "UNIQUE (idempotency_key), and INSERT ... ON CONFLICT DO NOTHING",
      },
      { id: "check", label: "Check, then insert", detail: "SELECT by key, and INSERT only if no row came back" },
      { id: "mutex", label: "In-process lock", detail: "A mutex around the insert inside each app server" },
      { id: "nightly", label: "Deduplicate nightly", detail: "Insert freely; a nightly job deletes duplicate keys" },
    ],
    answer: "unique",
    hint: "Only the database sees every server's insert.",
    senior:
      "A unique constraint makes the database the arbiter: concurrent inserts with one key conflict, and ON CONFLICT lets the retry find the original. Check-then-insert races, mutexes do not span servers, and nightly cleanup is too late.",
    principle: "Idempotency keys",
    why: "Exactly-once effects over unreliable networks are a staple of senior backend interviews.",
    reveal: "A unique idempotency key with INSERT ... ON CONFLICT: the database rejects the duplicate atomically.",
  },
  {
    id: "sql-5-not-null-migration",
    level: 5,
    seat: "integrity",
    kind: "pipeline",
    label: "Zero-downtime NOT NULL",
    prompt:
      "Add a required region column to a busy PostgreSQL table without long locks or failed writes. Order the steps.",
    stages: [
      "Add region as a nullable column",
      "Deploy code that writes region on every insert",
      "Backfill old rows in small batches",
      "Add CHECK (region IS NOT NULL) NOT VALID, then VALIDATE",
      "SET NOT NULL, which uses the validated check",
    ],
    hint: "The constraint comes last, once nothing can violate it.",
    senior:
      "A nullable column with no default is a quick catalog change. New writes must fill it before the backfill, or NULLs reappear. NOT VALID skips the scan, VALIDATE scans without blocking writes, and SET NOT NULL reuses it.",
    principle: "Expand and contract",
    why: "Senior engineers are expected to change schemas under live traffic.",
    reveal: "Add nullable, write it in code, backfill in batches, add and validate a NOT VALID check, then SET NOT NULL.",
  },
  {
    id: "sql-5-index-order",
    level: 5,
    seat: "performance",
    kind: "latency",
    label: "No sort needed",
    prompt:
      "events has a B-tree index on (tenant, ts). Mark each query whose filter and ORDER BY the index can serve with no separate sort step.",
    marks: ["Index order suffices", "Needs a sort"],
    items: [
      { id: "eq", label: "tenant = 1 ORDER BY ts", onPath: true },
      { id: "eq-desc", label: "tenant = 1 ORDER BY ts DESC", onPath: true },
      { id: "eq-range", label: "tenant = 1 AND ts > $1 ORDER BY ts", onPath: true },
      { id: "in", label: "tenant IN (1, 2) ORDER BY ts", onPath: false },
      { id: "range", label: "tenant > 5 ORDER BY ts", onPath: false },
      { id: "extra", label: "tenant = 1 ORDER BY ts, id", onPath: false },
      { id: "none", label: "ORDER BY ts LIMIT 10", onPath: false },
    ],
    hint: "After an equality on the leading column, rows come out sorted by the next column.",
    senior:
      "Equality on tenant fixes the first key, so rows emerge in ts order, forward or backward. An IN list or range on tenant interleaves tenants, id is not in the index, and with no tenant filter the index is ordered by tenant first.",
    principle: "Index-provided order",
    why: "Avoiding sorts on hot paths is a common way to make paginated endpoints fast.",
    reveal: "Only the single-tenant queries ordered by ts alone, in either direction, can skip the sort.",
  },
  {
    id: "sql-5-deterministic",
    level: 5,
    seat: "basics",
    kind: "context",
    label: "Deterministic?",
    prompt:
      "id is unique and the data does not change between runs. Sort each query fragment by whether its result is guaranteed identical every run.",
    groups: ["Always the same", "May differ between runs"],
    items: [
      { id: "by-id", label: "ORDER BY id LIMIT 10", group: "Always the same" },
      { id: "distinct-on-full", label: "DISTINCT ON (c) ORDER BY c, ts, id", group: "Always the same" },
      { id: "string-agg", label: "string_agg(x, ',' ORDER BY x)", group: "Always the same" },
      { id: "sum", label: "SUM(amount) on a numeric column", group: "Always the same" },
      { id: "ties", label: "ORDER BY score LIMIT 10, scores tie", group: "May differ between runs" },
      { id: "no-order", label: "LIMIT 10 with no ORDER BY", group: "May differ between runs" },
      { id: "distinct-on", label: "DISTINCT ON (c) ORDER BY c", group: "May differ between runs" },
      { id: "array-agg", label: "array_agg(x) with no ORDER BY", group: "May differ between runs" },
    ],
    hint: "Ask whether the query fully specifies which row wins and in what order.",
    senior:
      "Results are guaranteed only when the ordering is total over what matters. Ties, a missing ORDER BY, DISTINCT ON without a full sort, and order-sensitive aggregates can change with plans or parallelism. Exact numeric SUM cannot.",
    principle: "Determinism",
    why: "Flaky tests and unstable exports come from queries that only look deterministic.",
    reveal: "Total orderings, ordered aggregates, and numeric sums are stable; ties, missing ORDER BY, and unordered array_agg are not.",
  },
];

export const SQL: PathDef = {
  id: "sql",
  name: "SQL",
  castle: "The Ledger Keep",
  blurb: "Queries, joins, aggregates, windows, indexes, and transactions, read the way PostgreSQL reads them.",
  seats: {
    basics: "Querying basics",
    joins: "Joins",
    aggregation: "Aggregation",
    advanced: "Subqueries, CTEs & windows",
    performance: "Indexes & plans",
    integrity: "Transactions & design",
  },
  palette: 3,
  prologue: [
    "Above the harbor stands the Ledger Keep, where every stone is a row and every door a predicate.",
    "Its guardians once wrote queries that ran, then stopped asking whether the answers were right.",
    "They test NULLs, joins, groups, windows, indexes, and the locks that hold the ledger together.",
    "Answer as PostgreSQL would. The Keep does not accept 'it worked on my laptop.'",
  ],
  mentor: [
    "Say the logical order out loud: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY. It explains most bugs.",
    "Before you trust a join, ask how many rows each key matches. Fan-out quietly inflates every SUM.",
    "When a column can be NULL, say what happens to it. Interviewers listen for three-valued logic.",
    "For a slow query, ask for EXPLAIN ANALYZE before you guess. Compare estimated rows with actual rows.",
    "On concurrency, name the anomaly first, then the isolation level or lock that prevents it.",
  ],
  levels: {
    1: {
      title: "First Selections",
      focus: "Read and write basic queries: filters, joins, groups, keys, and NULL.",
      epigraph: "NULL is not nothing. It is not knowing.",
    },
    2: {
      title: "Applied Clauses",
      focus: "Apply each clause correctly: filter placement, grouping rules, ranks, and simple indexes.",
      epigraph: "Every clause runs in an order. Learn it before it learns you.",
    },
    3: {
      title: "Reading Real Queries",
      focus: "Read real queries and spot where rows multiply, vanish, or wait on each other.",
      epigraph: "A query that runs is not yet a query that is right.",
    },
    4: {
      title: "Failure Modes",
      focus: "Find the edge cases: empty input, frames, stale statistics, and concurrent writers.",
      epigraph: "The bug hides in the row nobody inserted in test.",
    },
    5: {
      title: "The Senior Ledger",
      focus: "Reason through production incidents: skew, plans, snapshots, and isolation.",
      epigraph: "Correct for one user is a hypothesis. Correct under load is a claim.",
    },
  },
  rooms: {
    foothills: {
      place: "The Select Steps",
      sign: ["THE SELECT STEPS", "Ask for exactly what you want. NULL will ask what you meant."],
      clear: "The Null Sentinel lowers his spear. Somewhere below, a comparison to NULL returns unknown.",
      seats: ["basics"],
      puzzles: [],
      guardian: {
        name: "The Null Sentinel",
        title: "Keeper of the Three Truths",
        domain: "Tests SELECT, WHERE, ORDER BY, LIMIT, NULLs, and the order a query is really read in.",
        look: "sentinel",
        intro: [
          "Halt. State your columns. An asterisk is not an answer, merely a habit.",
          "In my foothills there are three truths: true, false, and the one you forgot to handle.",
          "WHERE runs before SELECT, climber, no matter which you wrote first.",
          "Ask me for rows without ORDER BY and I will return them in whatever order suits me.",
        ],
        struck: [
          "IS NULL, not equals NULL. You have met my third truth before.",
          "Correct. You read the query in the order the engine does.",
          "A clean predicate. It keeps only what it means to keep.",
          "You asked for an order and named it. The rows comply.",
          "Well filtered. Unknown is not true, and you did not pretend it was.",
        ],
        taunt: [
          "You compared to NULL with an equals sign. It answered neither yes nor no.",
          "Your alias did not exist yet when WHERE went looking for it.",
          "No ORDER BY, no promise. You trusted a coincidence.",
          "NOT unknown is still unknown. Write that in the Codex.",
          "You filtered the rows you wanted and lost the ones you forgot.",
        ],
        defeat: [
          "My predicates yield. The gate road is yours, and so are its joins.",
          "You read SELECT last, as the engine does. Pass, climber.",
          "Three truths, all accounted for. The foothills have nothing left to ask.",
        ],
        triumph: [
          "Another climber undone by a NULL they never selected.",
          "Return when unknown no longer surprises you.",
          "The foothills keep their rows. Your heir will learn to filter them.",
        ],
      },
    },
    gate: {
      place: "The Join Bridge",
      sign: ["THE JOIN BRIDGE", "Two tables meet here. Count the matches before you cross."],
      clear: "The Key Warden hands over his ring. Each key, it turns out, matched exactly one lock.",
      seats: ["joins"],
      puzzles: [],
      guardian: {
        name: "The Key Warden",
        title: "Jailer of Matched Rows",
        domain: "Tests inner, outer, cross, self, semi, and anti joins, and how rows multiply across them.",
        look: "warden",
        intro: [
          "Every row at my bridge must show a matching key, unless you said LEFT.",
          "I keep the keys to two tables. Tell me how they meet, and how often.",
          "A condition in the wrong clause turns an outer join inner. Many crossed my bridge that way.",
          "Count your matches before you count your money. Joins multiply.",
        ],
        struck: [
          "Matched on the key, filtered in the right clause. The bridge holds.",
          "You kept the unmatched rows and knew why they came back as NULL.",
          "An anti-join, cleanly done. The missing rows are exactly the ones you sought.",
          "You counted the fan-out before it counted against you.",
          "Self-joined with two aliases. Even a jailer approves of clear names.",
        ],
        taunt: [
          "Your WHERE clause ate the NULLs your LEFT JOIN kept for you.",
          "Three orders and two addresses make six rows, not five.",
          "NULL does not equal NULL, not even on my bridge.",
          "You joined to test existence and got duplicates for your trouble.",
          "An inner join downstream undid your outer join upstream.",
        ],
        defeat: [
          "Take the keys. You know which rows each one opens.",
          "The bridge lowers for one who counts matches before crossing.",
          "My tables meet exactly as you described them. Pass.",
        ],
        triumph: [
          "Your rows multiplied, and your answer with them.",
          "The unmatched rows stay locked below. Come back for them.",
          "A join is a promise about cardinality. You broke it.",
        ],
      },
    },
    yard: {
      place: "The Tally Yard",
      sign: ["THE TALLY YARD", "Group first, filter after. The census is taken in that order."],
      clear: "The Tally Reeve rolls up her map. The grand total, at last, matches the sum of its parts.",
      seats: ["aggregation"],
      puzzles: [],
      guardian: {
        name: "The Tally Reeve",
        title: "Surveyor of Groups",
        domain: "Tests GROUP BY, HAVING, the three COUNTs, aggregates over NULL, and grouping rules.",
        look: "cartographer",
        intro: [
          "I survey the realm by groups. Bring me a GROUP BY and I will tell you what it hides.",
          "Count the rows, count the names, count the distinct names. Three numbers, three answers.",
          "Anything in SELECT that is not grouped had better be aggregated.",
          "Filter rows in WHERE. Filter groups in HAVING. Confuse them and my map lies.",
        ],
        struck: [
          "COUNT of a column skips its NULLs. You knew, and the census is correct.",
          "WHERE before grouping, HAVING after. The survey is sound.",
          "No groups, no rows; no GROUP BY, one row. Precisely charted.",
          "You weighted the average. The small villages no longer shout over the large.",
          "Grouped by the key and nothing else. A tidy map.",
        ],
        taunt: [
          "COUNT(*) counted the row your LEFT JOIN invented. Count the column instead.",
          "SUM of nothing is NULL, not zero. Coalesce it if you need a zero.",
          "An average of averages. The small region outvoted the large one.",
          "You put an aggregate in WHERE. It had not been computed yet.",
          "Daily uniques do not add up to monthly uniques. The same traveler came back.",
        ],
        defeat: [
          "Your totals reconcile. I fold my map.",
          "Every group accounted for, and none counted twice. Pass.",
          "The census closes. The stair awaits those who can nest their questions.",
        ],
        triumph: [
          "Your tally is off by every NULL you ignored.",
          "The map stays mine. Recount and return.",
          "Grouped wrongly, summed confidently. A common grave in this yard.",
        ],
      },
    },
    stair: {
      place: "The Recursive Stair",
      sign: ["THE RECURSIVE STAIR", "Each step asks the one before it. Bring a base case."],
      clear: "The Nested Jester's cube clicks shut. Every subquery on the stair returns what it promised.",
      seats: ["advanced"],
      puzzles: [],
      guardian: {
        name: "The Nested Jester",
        title: "Fool of Subqueries and Frames",
        domain: "Tests subqueries, IN and EXISTS, CTEs, recursion, and window functions with their frames.",
        look: "puzzlewright",
        intro: [
          "A query inside a query inside a staircase. Mind the steps; some of them look back at you.",
          "NOT IN, they say, is just the opposite of IN. I adore people who say that.",
          "My windows see every row and collapse none. Choose your frame carefully.",
          "Recurse with me, climber. Just bring a way to stop.",
        ],
        struck: [
          "Ha. You spotted the NULL inside my NOT IN. Few do.",
          "RANK skipped, DENSE_RANK did not. You counted the gaps correctly.",
          "Your recursion terminates. How disappointingly correct.",
          "You partitioned before you numbered. The cube turns in your favor.",
          "The default frame stops at the current row's peers. You knew it.",
        ],
        taunt: [
          "NOT IN met a NULL, and every row vanished. Delightful.",
          "LAST_VALUE gave you the current row. The frame was never the whole partition.",
          "Your window counted rows, not days. Some days were missing.",
          "You filtered a window function in WHERE. It had not been computed yet.",
          "A cycle, and no exit. The stair goes round forever.",
        ],
        defeat: [
          "The cube is solved. I hate it when that happens.",
          "Every nested question answered in order. Climb on.",
          "Your frames are framed correctly. The stair is yours.",
        ],
        triumph: [
          "You recursed into my stair and never found the base case.",
          "Nested too deep, returned too little. Try again, heir.",
          "The jester keeps the last laugh and the last row.",
        ],
      },
    },
    west: {
      place: "The Index Tower",
      sign: ["THE INDEX TOWER", "The fastest row is the one you never had to read."],
      clear: "The Duchess of Scans sets down her hourglass. The plan now finishes in milliseconds.",
      seats: ["performance"],
      puzzles: [],
      guardian: {
        name: "The Duchess of Scans",
        title: "Keeper of the Query Plan",
        domain: "Tests B-tree and composite indexes, sargability, EXPLAIN, statistics, and pagination.",
        look: "latency",
        intro: [
          "Time pours through my glass at the speed of your slowest scan.",
          "Show me the plan before you show me the fix. Guesswork is so very slow.",
          "An index is a promise to readers, paid for by every writer.",
          "Wrap my column in a function and my index forgets you exist.",
        ],
        struck: [
          "Equality first, range second. The index walks straight to your rows.",
          "You read actual rows against estimated rows. That is where plans go wrong.",
          "Keyset pagination. The hourglass barely moves.",
          "A covering index and an all-visible page. Not one trip to the heap.",
          "Sargable at last. The predicate meets the index halfway.",
        ],
        taunt: [
          "OFFSET one hundred thousand. Every skipped row was still read.",
          "lower(email) is not email. My index did not recognize you.",
          "N plus one queries. I counted every round trip.",
          "The planner trusted stale statistics, and so did you.",
          "Your index leads with the wrong column. The seek became a scan.",
        ],
        defeat: [
          "The hourglass stops. Your plan is faster than my patience.",
          "Well indexed, well measured. The west tower yields.",
          "You asked the planner instead of guessing. Pass, efficiently.",
        ],
        triumph: [
          "Sequential scan, row by row, until your time ran out.",
          "Your query was correct and very, very late.",
          "Return with EXPLAIN ANALYZE, not intuition.",
        ],
      },
    },
    east: {
      place: "The Locking Hall",
      sign: ["THE LOCKING HALL", "Commit or roll back. There is no third door."],
      clear: "The Isolation Architect commits his final drawing. Every constraint in the hall now holds.",
      seats: ["integrity"],
      puzzles: [],
      guardian: {
        name: "The Isolation Architect",
        title: "Designer of Keys and Locks",
        domain: "Tests ACID, isolation anomalies, locking, MVCC, constraints, and normalization tradeoffs.",
        look: "architect",
        intro: [
          "I draw keys, constraints, and locks. Tell me what happens when two writers arrive at once.",
          "Every anomaly has a name. Name it, and I will ask which isolation level forbids it.",
          "Normalize until it hurts, denormalize until it works, and know which one you did.",
          "A transaction is a promise: all of it or none of it, and nobody sees the middle.",
        ],
        struck: [
          "Lost update prevented, and with a single statement. Elegant.",
          "REPEATABLE READ in PostgreSQL stops phantoms. You read the actual manual.",
          "Write skew, named and handled. The blueprint holds.",
          "Locks taken in a consistent order. No deadlock in my halls.",
          "A constraint where the invariant lives. The database guards it for you.",
        ],
        taunt: [
          "You read, decided, and wrote. Someone else did too, and one write vanished.",
          "Two doctors went off call at once. Your isolation level let them.",
          "A foreign key with no index. Every delete searched the whole table.",
          "Check-then-insert is a race with a polite name.",
          "BEGIN and COMMIT alone do not make a read-modify-write safe.",
        ],
        defeat: [
          "Your schema stands, and so do its invariants. Pass.",
          "Commit acknowledged. The east hall is yours.",
          "You named the anomaly before the fix. That is how architects speak.",
        ],
        triumph: [
          "Your transaction rolled back, and so did your climb.",
          "Serialization failure. Retry from the foothills.",
          "The blueprint survives you. The Codex will remember why.",
        ],
      },
    },
    throne: {
      place: "The Ledger Throne",
      sign: ["THE LEDGER THRONE", "Every clause is audited. Every total must reconcile."],
      clear: "The Crown Auditor closes the ledger. Every row is accounted for, and so, at last, are you.",
      seats: ["basics", "joins", "aggregation", "advanced", "performance", "integrity"],
      puzzles: [],
      guardian: {
        name: "The Crown Auditor",
        title: "Examiner of Every Clause",
        domain: "Tests the whole ledger: queries, joins, aggregates, windows, plans, and transactions.",
        look: "examiner",
        intro: [
          "I audit the whole ledger: every clause, every join, every lock.",
          "The guardians below each asked one kind of question. I ask all of them.",
          "Show me a query, its plan, and what it does when two users run it at once.",
          "Precision is the price of the crown. Approximately correct is a different castle.",
        ],
        struck: [
          "Correct, and you named the edge case unprompted.",
          "The numbers reconcile. Few climbers reach this line.",
          "A senior answer: the fix, its cost, and the failure it prevents.",
          "You reasoned from the snapshot, not from hope.",
          "Clean. I have nothing to add, which is rare.",
        ],
        taunt: [
          "Right for one user. Wrong for two.",
          "The plan you assumed is not the plan that ran.",
          "Your query runs. Your numbers do not reconcile.",
          "A NULL slipped through, as they do, at the worst moment.",
          "You fixed the symptom. The audit asks for the cause.",
        ],
        defeat: [
          "The ledger balances. The crown is yours to keep, and to maintain.",
          "Every clause audited, every anomaly named. The Keep is yours.",
          "I sign off. Few queries pass my audit unchanged; yours did.",
        ],
        triumph: [
          "Your answer did not reconcile. The bloodline will recount.",
          "The audit finds a discrepancy. Return when the totals match.",
          "Even the best ledger needs a second pass. So do you.",
        ],
      },
    },
  },
  questions: [...LEVEL_1, ...LEVEL_2, ...LEVEL_3, ...LEVEL_4, ...LEVEL_5],
  puzzles: PUZZLES,
  mix: 0.25,
};
