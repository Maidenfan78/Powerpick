export interface DrawMessage {
  draw_number: number;
}

export function connectDrawSocket(
  gameId: string,
  onMessage: (msg: DrawMessage) => void,
): WebSocket {
  const loc = typeof window !== "undefined" ? window.location : { protocol: "ws:", host: "" } as Location;
  const proto = loc.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${loc.host}/ws/draws/${gameId}`);
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      onMessage(data as DrawMessage);
    } catch (err) {
      console.error("WebSocket message error", err);
    }
  };
  return ws;
}
