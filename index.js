const express = require('express');
const AWS = require('aws-sdk');
const app = express();
const PORT = 3000;

app.use(express.json());

AWS.config.update({ region: "us-east-1" });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/992382818251/Test-Queue";

let pacientes = [
  { id: 1, nombre: "Josuesote", edad: 30 }
];

app.get('/pacientes', (req, res) => {
  res.json(pacientes);
});

app.post('/pacientes', (req, res) => {
  const nuevoPaciente = {
    id: pacientes.length + 1,
    nombre: req.body.nombre,
    edad: req.body.edad
  };
  pacientes.push(nuevoPaciente);
  res.status(201).json(nuevoPaciente);
});

app.post('/pacientes/:id/medicinas', (req, res) => {
  const pacienteId = parseInt(req.params.id);
  const paciente = pacientes.find(p => p.id === pacienteId);

  if (!paciente) {
    return res.status(404).json({ mensaje: "Paciente no encontrado" });
  }

  const bodyPayload = {
    action: 'create',
    payload: {
      nombre: req.body.nombre,
      dosis: req.body.dosis,
      idPaciente: pacienteId
    }
  };

  const params = {
    DelaySeconds: 10,
    MessageBody: JSON.stringify(bodyPayload),
    QueueUrl: QUEUE_URL
  };

  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.error("Error al enviar mensaje a SQS:", err);
      res.status(500).json({ mensaje: "Error al enviar a la cola" });
    } else {
      console.log("Mensaje enviado a SQS con ID:", data.MessageId);
      res.status(202).json({ mensaje: "Mensaje enviado a SQS", messageId: data.MessageId });
    }
  });
});

app.listen(PORT, () => {
  console.log(`API de Pacientes corriendo en http://localhost:${PORT}`);
});

