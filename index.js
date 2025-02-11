const XLSX = require("xlsx");
const nodemailer = require("nodemailer");
require("dotenv").config();

let collection = [];

const storePpl = ({ user, topic, random }) => {
    collection.push({ user, topic, random });
};

const randomize = (data) => {
    if (data.length < 2) {
        console.error("⚠️ No hay suficientes usuarios para hacer asignaciones aleatorias.");
        return [];
    }

    let topics = data.map(item => item.topic); // Lista de topics
    let shuffledTopics = [...topics];

    for (let i = 0; i < data.length; i++) {
        let availableTopics = shuffledTopics.filter(t => t !== data[i].topic); // Filtra el topic original

        if (availableTopics.length === 0) {
            console.error("⚠️ Error: No se puede asignar topics sin repetición.");
            return [];
        }

        let randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];

        shuffledTopics.splice(shuffledTopics.indexOf(randomTopic), 1); // Eliminar para evitar repetición

        storePpl({ user: data[i].user, topic: data[i].topic, random: randomTopic });
    }

    return collection;
};

const readExcelFile = (filePath) => {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(sheet);

    return jsonData.map(({ USER, TOPIC }) => ({
        user: USER,
        topic: TOPIC
    }));
};

// Ruta del archivo Excel
const filePath = "C:\\Users\\Constanza Sanz\\Desktop\\PPT_PARTY\\PPT_SHEET.xlsx";

// Leer el archivo y asignar topics aleatorios
const data = readExcelFile(filePath);
const resultColl = randomize(data);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_ACCOUNT,      // Tu dirección de Gmail
      pass:  process.env.GMAIL_APP_PWD // La contraseña de aplicación generada
    }
  });

// Función para enviar email
const sendEmail = (to, randomTopic) => {
    const mailOptions = {
        from: process.env.gmail , // Reemplaza con tu email
        to: to,
        subject: "| TOP SECRET | FIESTA POWER POINT |",
        html: `<img src="cid:imagen_unica" alt="Foto">
        <p style="font-size:20px;font-style: italic;">Has sido elegida para defender ... <span style ="font-size:30px;color:red;">${randomTopic}</span></p>
      `,
        attachments: [{
            filename: 'jigsaw.jpg', // Nombre del archivo en el correo
            path: 'jigsaw.jpg', // Ruta a la imagen en tu sistema
            cid: 'imagen_unica' // Mismo cid que se utiliza en el HTML
        }]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(`Error enviando email a ${to}:`, error);
        } else {
            console.log(`Email enviado a ${to}: ${info.response}`);
        }
    });
};

resultColl.forEach(({ user, random }) => {
    sendEmail(user, random);
});