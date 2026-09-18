# docker-calculator-playwright
Playwright API tests for the calculator microservices app.

## Run the tests

Start the calculator stack from `/Users/pilch/dev/codebase/javascript/my_projects/calc_node_docker`:

```bash
docker compose up --build -d
```

Then, from this project:

```bash
npm test
```

The tests call each backend directly on ports `8081` through `8084`, then call the same operation through the authenticated proxy on port `8888` and compare the complete JSON responses.

The defaults are `http://localhost:8888` and `burgerking`, matching the local Nginx configuration. Override them without changing the tests:

```bash
CALCULATOR_PROXY_URL=http://localhost:8888 CALCULATOR_API_KEY=burgerking npm test
```
