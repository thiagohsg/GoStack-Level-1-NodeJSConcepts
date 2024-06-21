const express = require("express");
const cors = require("cors");

const { v4: uuid, validate: isUuid } = require('uuid');

const app = express();

// Função que todas as rotas passam por ela para o express interpretar o JSON.
app.use(express.json());
app.use(cors());

const repositories = [];

function logRequests(request, response, next) {
  const { method, url } = request;
  const logLabel = `${new Date().toISOString()} - [${method.toUpperCase()}] ${url}`;

  console.time(logLabel);

  // Chama o próximo middleware para não interromper a requisição
  next();

  console.timeEnd(logLabel);
}

function logRequestsStatus(request, response, next) {
  const { method, url } = request;
  const start = Date.now();

  response.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = response;
    const logMessage = `${new Date().toISOString()} - [${method.toUpperCase()}] ${statusCode} ${url} - ${duration}ms`;
    console.log(logMessage);
  });

  // Chama o próximo middleware para não interromper a requisição
  next();
}


function validateRepositoryID(request, response, next) {
  const { id } = request.params;

  if (!isUuid(id)) {
    return response.status(400).json({ erro: 'Invalid repository ID.' });
  }

  return next();
}

// app.use(logRequests);
app.use(logRequestsStatus);

// especificando as rotas que vão utilzar o middleware
app.use('/repositories/:id', validateRepositoryID);

app.get("/repositories", (request, response) => {
  const { title } = request.query;

  const results = title
    ? repositories.filter(repository => repository.title.includes(title))
    : repositories;

  return response.json(results);
});

app.post("/repositories", (request, response) => {
  const { title, url, techs } = request.body;

  const repository = { id: uuid(), title, url, techs, likes: 0 };

  repositories.push(repository);

  return response.json(repository);
});

app.put("/repositories/:id", (request, response) => {
  const { id } = request.params;
  const { title, url, techs } = request.body;

  // Procuro a posição do projeto no vetor findIndex
  const repositoryIndex = repositories.findIndex(repository => repository.id === id);

  if (repositoryIndex < 0) {
    return response.status(400).json({ error: 'Repository not found!' });
  }

  const repository = {
    id,
    title,
    url,
    techs,
    likes: repositories[repositoryIndex].likes
  };

  repositories[repositoryIndex] = repository;

  return response.json(repository);
});

app.delete("/repositories/:id", (request, response) => {
  const { id } = request.params;

  const repositoryIndex = repositories.findIndex(repository => repository.id === id);

  if (repositoryIndex < 0) {
    return response.status(400).json({ error: 'Repository not found!' });
  }

  repositories.splice(repositoryIndex, 1);

  return response.status(204).send();
});

app.post("/repositories/:id/like", (request, response) => {
  const { id } = request.params;

  const repositoryIndex = repositories.findIndex(repository => repository.id === id);

  if (repositoryIndex < 0) {
    return response.status(400).json({ error: 'Repository not found!' });
  }

  const like = {
    likes: ++repositories[repositoryIndex].likes
  }

  return response.json(repositories[repositoryIndex]);
});

module.exports = app;
