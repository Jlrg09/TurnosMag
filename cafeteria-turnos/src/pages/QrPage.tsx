import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import QRCode from "react-qr-code";

const API_URL = "http://localhost:8000/api";

const QrPage: React.FC = () => {
  const [qrValue, setQrValue] = useState<string>("");
  const [showManual, setShowManual] = useState<boolean>(false);
  const [codigoInput, setCodigoInput] = useState<string>("");
  const [mensaje, setMensaje] = useState<string>("");
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [turnoGenerado, setTurnoGenerado] = useState<null | {
    codigo_turno: string;
    estudiante: string;
    cafeteria: string;
    fecha: string;
  }>(null);
  const timeoutNoti = useRef<NodeJS.Timeout | null>(null);

  // QR dinámico auto-cambiable
  useEffect(() => {
    if (showManual) return;
    let interval = setInterval(() => {
      const random = Math.random().toString(36).substring(2, 10);
      setQrValue("UNIMAG_" + random);
    }, 5000);

    setQrValue("UNIMAG_" + Math.random().toString(36).substring(2, 10));
    return () => clearInterval(interval);
  }, [showManual]);

  // Notificación auto-ocultable
  useEffect(() => {
    if (notificacion) {
      if (timeoutNoti.current) clearTimeout(timeoutNoti.current);
      timeoutNoti.current = setTimeout(() => setNotificacion(null), 3500);
      return () => {
        if (timeoutNoti.current) clearTimeout(timeoutNoti.current);
      };
    }
  }, [notificacion]);

  // Generación manual (por código)
  const handleGenerarTurnoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setTurnoGenerado(null);

    if (!codigoInput.trim()) {
      setMensaje("Por favor ingresa el código del estudiante.");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/turnos/crear/publico/`, { codigo_estudiantil: codigoInput.trim() });
      setTurnoGenerado({
        codigo_turno: res.data.codigo_turno,
        estudiante: res.data.estudiante,
        cafeteria: res.data.cafeteria,
        fecha: res.data.fecha,
      });
      setMensaje("");
      setNotificacion(`Turno generado: ${res.data.codigo_turno}`);
      setCodigoInput("");
      setTimeout(() => setTurnoGenerado(null), 5000);
    } catch (err: any) {
      setMensaje(err.response?.data?.mensaje || "No se pudo generar el turno. Verifica el código.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e9f7ef 0%, #e3f6fd 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        fontFamily: "'Segoe UI', 'Roboto', Arial, sans-serif",
        padding: "0 16px",
      }}
    >
      {/* Notificación flotante */}
      {notificacion && (
        <div style={{
          position: "fixed",
          top: 34,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#33d17a",
          color: "#fff",
          fontWeight: 800,
          fontSize: 20,
          padding: "14px 34px",
          borderRadius: 16,
          boxShadow: "0 3px 14px #20793e44",
          zIndex: 9999,
          letterSpacing: 1,
          transition: "opacity 0.4s",
          opacity: notificacion ? 1 : 0,
        }}>
          {notificacion}
        </div>
      )}

      {/* Título superior */}
      <div style={{ width: "100%", maxWidth: 400, marginTop: 32, marginBottom: 24, textAlign: "center" }}>
        <h1 style={{
          color: "#178041",
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: 1.5,
          marginBottom: 3,
          marginTop: 0,
          textAlign: "center",
        }}>
          Generador de Turno QR
        </h1>
        <div style={{
          color: "#20793e",
          fontWeight: 500,
          fontSize: 16,
          textAlign: "center",
          lineHeight: 1.25,
        }}>
          Escanea el siguiente QR desde tu app o dispositivo para validar que puedes generar tu turno de cafetería.<br />
          <span style={{ color: "#e67e22", fontWeight: 700 }}>Si no tienes celular, pide a un encargado que genere tu turno con tu código estudiantil.</span>
        </div>
      </div>

      {/* QR dinámico en el centro */}
      {!showManual && (
        <div style={{
          background: "#fff",
          borderRadius: 26,
          boxShadow: "0 4px 24px #b4e0e422",
          padding: "48px 48px 40px 48px",
          margin: "0 auto 30px auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 280,
          maxWidth: 370,
        }}>
          <div
            style={{
              background: "#fff",
              border: "5px solid #178041",
              borderRadius: 18,
              boxShadow: "0 2px 18px #20793e22",
              marginBottom: 12,
              padding: 8,
              display: "inline-block"
            }}
          >
            <QRCode
              value={qrValue}
              size={210}
              bgColor="#e9f7ef"
              fgColor="#178041"
              style={{
                width: 210,
                height: 210,
                background: "#fff",
                borderRadius: 12
              }}
            />
          </div>
          <div style={{
            color: "#20793e",
            fontSize: 14,
            marginBottom: 0,
            textAlign: "center"
          }}>
            (Este código QR cambia cada 5 segundos)
          </div>
        </div>
      )}

      {/* Botón para generar turno manualmente o volver al QR */}
      <div style={{ width: "100%", maxWidth: 370 }}>
        {!showManual ? (
          <button
            onClick={() => {
              setShowManual(true);
              setMensaje("");
              setTurnoGenerado(null);
            }}
            style={{
              width: "100%",
              padding: "15px 0",
              background: "#33d17a",
              color: "#fff",
              border: "none",
              borderRadius: 11,
              fontWeight: 800,
              fontSize: 18,
              cursor: "pointer",
              boxShadow: "0 2px 8px #b4e0e433",
              marginBottom: 22,
              marginTop: 0,
              letterSpacing: 1
            }}
          >
            ¿No tienes celular? Pide tu turno con tu código aquí
          </button>
        ) : (
          <button
            onClick={() => {
              setShowManual(false);
              setMensaje("");
              setTurnoGenerado(null);
            }}
            style={{
              width: "100%",
              padding: "13px 0",
              background: "#178041",
              color: "#fff",
              border: "none",
              borderRadius: 11,
              fontWeight: 800,
              fontSize: 18,
              cursor: "pointer",
              boxShadow: "0 2px 8px #b4e0e433",
              marginBottom: 22,
              marginTop: 0,
              letterSpacing: 1
            }}
          >
            Volver al QR dinámico
          </button>
        )}

        {/* Formulario para generar turno manual */}
        {showManual && (
          <form
            onSubmit={handleGenerarTurnoManual}
            style={{
              background: "#fff",
              borderRadius: 13,
              boxShadow: "0 2px 14px #b4e0e444",
              padding: "24px 20px 14px 20px",
              marginBottom: 10,
              marginTop: -10,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignItems: "center"
            }}
          >
            <label style={{ fontWeight: 700, color: "#178041", fontSize: 16 }}>
              Ingresa el código estudiantil:
            </label>
            <input
              value={codigoInput}
              onChange={e => setCodigoInput(e.target.value)}
              placeholder="Ej: 2020123456"
              style={{
                padding: "11px 16px",
                borderRadius: 9,
                border: "1.5px solid #d0ece7",
                fontSize: 17,
                width: 220,
                outline: "none",
                background: "#f8fafd",
                transition: "border 0.2s",
                fontWeight: 600,
                textAlign: "center",
                letterSpacing: 1.2,
              }}
              maxLength={15}
            />
            <button
              type="submit"
              style={{
                padding: "11px 0",
                background: "#178041",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                fontWeight: 700,
                fontSize: 17,
                cursor: "pointer",
                width: 170,
                boxShadow: "0 2px 8px #d0ece755",
                marginTop: 0,
                letterSpacing: 1
              }}
            >
              Generar turno
            </button>
            {/* Mensaje de error/éxito */}
            {mensaje && (
              <div style={{
                color: mensaje.includes("correctamente") ? "#178041" : "#e74c3c",
                fontWeight: 700,
                textAlign: "center",
                marginTop: 5,
                fontSize: 15,
              }}>
                {mensaje}
              </div>
            )}
            {/* Resultado del turno generado */}
            {turnoGenerado && (
              <div
                style={{
                  background: "#e9f7ef",
                  borderRadius: 9,
                  padding: "10px 14px",
                  marginTop: 10,
                  fontWeight: 700,
                  color: "#20793e",
                  fontSize: 17,
                  textAlign: "center",
                  boxShadow: "0 1px 6px #b4e0e422"
                }}
              >
                Turno generado:<br />
                <span style={{ fontSize: 21, color: "#178041" }}>{turnoGenerado.codigo_turno}</span>
                <div style={{ fontSize: 14, color: "#20793e" }}>
                  Estudiante: <b>{turnoGenerado.estudiante}</b><br />
                  Cafetería: <b>{turnoGenerado.cafeteria}</b><br />
                  Fecha: <b>{new Date(turnoGenerado.fecha).toLocaleString()}</b>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default QrPage;