
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendLowStockAlert(product) {
  try {
    await transporter.sendMail({
      from: `"Sistema de Inventario" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `⚠️ Stock bajo: ${product.name}`,
html: `
  <div
    style="
      background-color: #f4f4f5;
      padding: 40px 20px;
      font-family: -apple-system, Helvetica, Arial, sans-serif;
    "
  >
    <div
      style="
        max-width: 480px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      "
    >
      <!-- Encabezado -->
      <div
        style="
          background-color: #111111;
          padding: 24px 32px;
        "
      >
        <p
          style="
            margin: 0;
            color: #ffffff;
            font-size: 13px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            opacity: 0.7;
          "
        >
          Mi Negocio
        </p>

        <h1
          style="
            margin: 4px 0 0;
            color: #ffffff;
            font-size: 20px;
            font-weight: 600;
          "
        >
          ⚠️ Alerta de stock bajo
        </h1>
      </div>

      <!-- Contenido -->
      <div style="padding: 32px;">
        <p
          style="
            margin: 0 0 16px;
            color: #333;
            font-size: 15px;
            line-height: 1.5;
          "
        >
          El siguiente producto ha alcanzado un nivel de inventario crítico
          y podría quedarse sin stock pronto:
        </p>

        <!-- Producto -->
        <div
          style="
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 20px;
          "
        >
          <p
            style="
              margin: 0 0 4px;
              font-size: 16px;
              font-weight: 700;
              color: #111;
            "
          >
            ${product.name}
          </p>

          <p
            style="
              margin: 0;
              font-size: 13px;
              color: #888;
            "
          >
            SKU: ${product.sku}
          </p>
        </div>

        <!-- Información del stock -->
        <table
          style="
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          "
        >
          <tr>
            <td
              style="
                padding: 10px 0;
                border-bottom: 1px solid #eee;
                color: #666;
                font-size: 14px;
              "
            >
              Stock actual
            </td>

            <td
              style="
                padding: 10px 0;
                border-bottom: 1px solid #eee;
                text-align: right;
                font-size: 18px;
                font-weight: 700;
                color: #dc2626;
              "
            >
              ${product.stock}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 10px 0;
                color: #666;
                font-size: 14px;
              "
            >
              Stock mínimo configurado
            </td>

            <td
              style="
                padding: 10px 0;
                text-align: right;
                font-size: 14px;
                color: #333;
              "
            >
              ${product.minStock}
            </td>
          </tr>
        </table>

        <!-- Recomendación -->
        <p
          style="
            margin: 0;
            color: #666;
            font-size: 13px;
            line-height: 1.5;
          "
        >
          Te recomendamos reabastecer este producto pronto para evitar
          quedarte sin inventario disponible para tus ventas.
        </p>
      </div>

      <!-- Pie de correo -->
      <div
        style="
          padding: 16px 32px;
          background-color: #fafafa;
          border-top: 1px solid #eee;
        "
      >
        <p
          style="
            margin: 0;
            color: #999;
            font-size: 12px;
            text-align: center;
          "
        >
          Este es un correo automático de tu Sistema de Inventario
          y Facturación.
        </p>
      </div>
    </div>
  </div>
`,

    });

    console.log(
      `Alerta de stock bajo enviada para: ${product.name}`
    );
  } catch (err) {
    console.error(
      'Error al enviar correo de stock bajo:',
      err.message
    );
  }
}

module.exports = {
  sendLowStockAlert,
};
