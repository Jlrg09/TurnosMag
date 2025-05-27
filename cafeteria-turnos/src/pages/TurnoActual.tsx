import { useEffect, useState, useRef } from 'react';

interface Cafeteria {
  id: number;
  nombre: string;
  estado: string;
  horario_apertura: string;
  horario_cierre: string;
  updated_at: string;
}

interface Turno {
  id: number;
  codigo_turno: string;
  usuario: string;
  cafeteria: { id: number; nombre: string };
  fecha: string;
  estado: string;
  generado_en: string;
  reclamado_en: string | null;
}

function getCafeteriaColor(estado?: string) {
  switch (estado) {
    case 'abierta':
      return '#26b100'; 
    case 'reabastecimiento':
      return '#FFD600'; 
    case 'cerrada':
      return '#e74c3c'; 
    default:
      return '#e67e22'; 
  }
}

function capitalize(str?: string) {
  if (!str) return 'Desconocido';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Duración máxima del turno en segundos
const TIEMPO_LIMITE_SEGUNDOS = 30;

function TurnoActual() {
  const [turno, setTurno] = useState<Turno | null>(null);
  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null);
  const [alerta, setAlerta] = useState('');
  const [hora, setHora] = useState<string>(new Date().toLocaleTimeString());
  const [notificacion, setNotificacion] = useState<string>('');
  const [expiraEn, setExpiraEn] = useState<number | null>(null);
  const prevTurnoId = useRef<number | null>(null);

  // Sound
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setHora(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sonido cuando cambia el turno
  useEffect(() => {
    if (notificacion && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  }, [notificacion]);

  useEffect(() => {
    const fetchCafeteria = () => {
      fetch('http://localhost:5173/api/cafeteria/')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setCafeteria(data[0]);
          } else if (data && data.id) {
            setCafeteria(data);
          } else {
            setCafeteria(null);
          }
        })
        .catch(() => setCafeteria(null));
    };
    fetchCafeteria();
    const interval = setInterval(fetchCafeteria, 2000);
    return () => clearInterval(interval);
  }, []);

  // Maneja obtención y cambio de turno, con notificación y sonido
  const cargarTurno = () => {
    fetch('http://localhost:5173/api/turnos/actual/')
      .then(res => {
        if (!res.ok) throw new Error('No se pudo obtener el turno actual');
        return res.json();
      })
      .then(data => {
        if (!data || data.id === undefined || data.id === null) {
          if (prevTurnoId.current !== null) {
            setNotificacion('¡El turno ha cambiado!');
            setTimeout(() => setNotificacion(''), 3000);
          }
          setTurno(null);
          prevTurnoId.current = null;
          setAlerta('');
        } else {
          if (prevTurnoId.current !== null && prevTurnoId.current !== data.id) {
            setNotificacion('¡El turno ha cambiado!');
            setTimeout(() => setNotificacion(''), 3000);
          }
          setTurno(data);
          prevTurnoId.current = data.id;
          setAlerta('');
        }
      })
      .catch(() => {
        setTurno(null);
        setAlerta('No se pudo obtener el turno actual');
      });
  };

  useEffect(() => {
    cargarTurno();
    const interval = setInterval(cargarTurno, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  // Actualiza tiempo de expiración cada segundo
  useEffect(() => {
    let timer: NodeJS.Timeout;
    function updateExpira() {
      if (turno && turno.generado_en) {
        const generado = new Date(turno.generado_en).getTime();
        const ahora = Date.now();
        const diff = Math.floor((ahora - generado) / 1000);
        setExpiraEn(Math.max(0, TIEMPO_LIMITE_SEGUNDOS - diff));
      } else {
        setExpiraEn(null);
      }
    }
    updateExpira();
    timer = setInterval(updateExpira, 1000);
    return () => clearInterval(timer);
  }, [turno]);

  const logoUrl = "/logo192.png";

  const estadoCafeteria = capitalize(cafeteria?.estado);
  const estadoCirculo = getCafeteriaColor(cafeteria?.estado);
  const estadoColor = estadoCirculo;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      fontFamily: "'Segoe UI', 'Roboto', Arial, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Audio para cambio de turno */}
      <audio ref={audioRef} src="/turno-beep.mp3" preload="auto" />
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 32px 16px 32px'
      }}>
        <div style={{ fontSize: 32, fontWeight: 'bold', color: '#20793e', letterSpacing: 2 }}>
          Turnos de almuerzo
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#178041',
            background: 'rgba(255,255,255,0.4)',
            borderRadius: 8,
            padding: '6px 16px',
            letterSpacing: 1
          }}>{hora}</span>
          <img src={logoUrl} alt="Logo" style={{ height: 48, width: 48, objectFit: 'contain', borderRadius: 12 }} />
        </div>
      </header>

      {/* Notificación de cambio de turno */}
      {notificacion && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#f8ffb0',
          color: '#20793e',
          fontWeight: 'bold',
          fontSize: 22,
          padding: '14px 38px',
          borderRadius: 16,
          boxShadow: '0 3px 14px #20793e44',
          zIndex: 9999,
          letterSpacing: 1
        }}>
          {notificacion}
        </div>
      )}

      {/* Contenido principal */}
      <main style={{
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '-48px'
      }}>
        <div style={{
          padding: '40px 36px 32px 36px',
          borderRadius: 32,
          background: 'rgba(255,255,255,0.93)',
          boxShadow: '0 10px 36px rgba(24, 149, 76, 0.14)',
          minWidth: 350,
          minHeight: 230,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {alerta ? (
            <div style={{
              color: '#e74c3c',
              fontWeight: 'bold',
              fontSize: 20,
              marginTop: 16
            }}>{alerta}</div>
          ) : !turno ? (
            <div style={{
              fontWeight: 'bold',
              color: '#178041',
              fontSize: 22,
              letterSpacing: 1
            }}>
              No hay nadie en fila
            </div>
          ) : (
            <>
              <div style={{
                fontSize: 28,
                color: '#20793e',
                fontWeight: 700,
                letterSpacing: 1,
                marginBottom: 12
              }}>
                {turno.cafeteria?.nombre ?? 'Cafetería'}: <span style={{
                  color: '#0e4d1a',
                  background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                  borderRadius: 12,
                  padding: '2px 18px',
                  fontSize: 44,
                  fontWeight: 900,
                  marginLeft: 8,
                  boxShadow: '0 2px 12px #43e97b44'
                }}>{turno.codigo_turno}</span>
              </div>
              <div style={{
                fontSize: 22,
                color: '#178041',
                fontWeight: 500,
                marginBottom: 6,
                marginTop: 18
              }}>
                Estudiante: <span style={{ fontWeight: 700 }}>{turno.usuario}</span>
              </div>
              {/* Tiempo de expiración */}
              <div style={{
                fontSize: 20,
                fontWeight: 700,
                color: expiraEn !== null && expiraEn <= 10 ? '#e67e22' : '#20793e',
                marginTop: 18,
                background: '#eaffd7',
                borderRadius: 10,
                padding: '7px 18px'
              }}>
                Tiempo para reclamar: {expiraEn !== null ? (
                  expiraEn > 0 ? `${Math.floor(expiraEn / 60)}:${String(expiraEn % 60).padStart(2, '0')} segundos` : 'Expirado'
                ) : '-'}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Estado de la cafetería */}
      <footer style={{
        width: '100%',
        position: 'fixed',
        left: 0,
        bottom: 0,
        padding: '20px 0px',
        background: 'rgba(255,255,255,0.77)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        boxShadow: '0 -2px 18px #43e97b22',
        zIndex: 100
      }}>
        <span style={{
          fontSize: 30,
          color: estadoColor,
          fontWeight: 700,
          letterSpacing: 1,
          display: 'flex',
          alignItems: 'center'
        }}>
          Estado de la cafetería: {estadoCafeteria}
          <span
            style={{
              display: 'inline-block',
              width: 22,
              height: 22,
              backgroundColor: estadoCirculo,
              borderRadius: '50%',
              marginLeft: 16,
              border: '2px solid #eee',
              boxShadow: '0 1px 4px #43e97b33',
              transition: 'background-color 0.3s'
            }}
          ></span>
        </span>
      </footer>
    </div>
  );
}

export default TurnoActual;