
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RoomRequest = {
  id: string;
  category_code: string;
  title: string | null;
  status: string;
  created_at: string;
};

type Room = {
  id: string;
  room_number: string;
  is_active: boolean;
  dnd: boolean;
  cmr: boolean;
  requests: RoomRequest[];
};

type ApiResponse = {
  rooms?: Room[];
  totals?: {
    rooms: number;
    dnd: number;
    cmr: number;
  };
  error?: string;
};

type Floor = {
  number: number;
  rooms: Room[];
};

export default function RoomStatusPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedFloors, setExpandedFloors] = useState<number[]>([]);

  const loadRooms = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/admin/room-status", {
        cache: "no-store",
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load room status.");
      }

      setRooms(result.rooms ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load room status."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();

    const interval = window.setInterval(() => {
      void loadRooms();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadRooms]);

  const floors = useMemo<Floor[]>(() => {
    const grouped = new Map<number, Room[]>();

    for (const room of rooms) {
      const floorNumber = Math.floor(
        Number(room.room_number) / 100
      );

      if (!Number.isFinite(floorNumber)) continue;

      const floorRooms = grouped.get(floorNumber) ?? [];
      floorRooms.push(room);
      grouped.set(floorNumber, floorRooms);
    }

    return Array.from(grouped.entries())
      .map(([number, floorRooms]) => ({
        number,
        rooms: floorRooms.sort(
          (a, b) =>
            Number(a.room_number) - Number(b.room_number)
        ),
      }))
      .sort((a, b) => a.number - b.number);
  }, [rooms]);

  const totals = useMemo(
    () => ({
      rooms: rooms.length,
      dnd: rooms.filter((room) => room.dnd).length,
      cmr: rooms.filter((room) => room.cmr).length,
    }),
    [rooms]
  );

  function toggleFloor(floorNumber: number) {
    setExpandedFloors((current) =>
      current.includes(floorNumber)
        ? current.filter((number) => number !== floorNumber)
        : [...current, floorNumber]
    );
  }

  function openAll() {
    setExpandedFloors(floors.map((floor) => floor.number));
  }

  function closeAll() {
    setExpandedFloors([]);
  }

  function roomColor(room: Room) {
    if (room.dnd) return "room-tile room-dnd";
    if (room.cmr) return "room-tile room-cmr";
    return "room-tile room-normal";
  }

  if (loading) {
    return (
      <main className="room-status-page">
        <p className="room-status-message">Loading room status...</p>
      </main>
    );
  }

  return (
    <main className="room-status-page">
      <style jsx>{`
        .room-status-page {
          min-height: 100vh;
          padding: 28px;
          background: #f4f6f8;
          color: #17212b;
          font-family: Arial, Helvetica, sans-serif;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        h1 {
          margin: 0 0 6px;
          font-size: 28px;
        }

        .subtitle {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        button {
          cursor: pointer;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 14px;
          background: white;
          color: #17212b;
          font-weight: 600;
        }

        button:hover {
          background: #eef2f7;
        }

        .refresh-button {
          background: #172b4d;
          border-color: #172b4d;
          color: white;
        }

        .refresh-button:hover {
          background: #253f66;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 18px;
        }

        .summary-label {
          color: #64748b;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .summary-value {
          font-size: 28px;
          font-weight: 700;
        }

        .floor-list {
          display: grid;
          gap: 10px;
        }

        .floor-card {
          overflow: hidden;
          border: 1px solid #dce3eb;
          border-radius: 12px;
          background: white;
        }

        .floor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          width: 100%;
          border: 0;
          border-radius: 0;
          padding: 16px 18px;
          text-align: left;
          background: white;
        }

        .floor-header:hover {
          background: #f8fafc;
        }

        .floor-title {
          font-size: 16px;
          font-weight: 700;
        }

        .floor-counts {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .count-pill {
          border-radius: 20px;
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 700;
        }

        .count-dnd {
          color: #991b1b;
          background: #fee2e2;
        }

        .count-cmr {
          color: #166534;
          background: #dcfce7;
        }

        .room-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
          padding: 18px;
          border-top: 1px solid #e2e8f0;
        }

        .room-tile {
          min-height: 76px;
          border: 1px solid transparent;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 7px;
        }

        .room-number {
          font-size: 19px;
          font-weight: 700;
        }

        .room-labels {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .room-label {
          font-size: 10px;
          font-weight: 700;
          border-radius: 4px;
          padding: 3px 5px;
          background: rgba(255, 255, 255, 0.7);
        }

        .room-normal {
          background: #e5e7eb;
          border-color: #d1d5db;
          color: #374151;
        }

        .room-dnd {
          background: #fecaca;
          border-color: #f87171;
          color: #991b1b;
        }

        .room-cmr {
          background: #bbf7d0;
          border-color: #4ade80;
          color: #166534;
        }

        .error-box {
          border: 1px solid #fca5a5;
          background: #fef2f2;
          color: #991b1b;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 18px;
        }

        .room-status-message {
          padding: 30px;
          text-align: center;
        }

        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 18px;
          color: #475569;
          font-size: 13px;
        }

        .legend-item {
          display: flex;
          gap: 7px;
          align-items: center;
        }

        .legend-color {
          display: inline-block;
          width: 13px;
          height: 13px;
          border-radius: 4px;
        }

        @media (max-width: 600px) {
          .room-status-page {
            padding: 14px;
          }

          .summary {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          h1 {
            font-size: 23px;
          }

          .room-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 7px;
            padding: 12px;
          }

          .room-number {
            font-size: 17px;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1>Room Status</h1>
          <p className="subtitle">
            Live room overview · Automatically refreshes every 30 seconds
          </p>
        </div>

        <div className="actions">
          <button onClick={openAll}>Open All</button>
          <button onClick={closeAll}>Close All</button>
          <button
            className="refresh-button"
            onClick={() => void loadRooms()}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-box">
          <strong>Could not load room status.</strong>
          <p>{error}</p>
          <button onClick={() => void loadRooms()}>
            Try Again
          </button>
        </div>
      )}

      <section className="summary">
        <div className="summary-card">
          <div className="summary-label">Active Rooms</div>
          <div className="summary-value">{totals.rooms}</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Do Not Disturb</div>
          <div className="summary-value" style={{ color: "#b91c1c" }}>
            {totals.dnd}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Clean My Room</div>
          <div className="summary-value" style={{ color: "#15803d" }}>
            {totals.cmr}
          </div>
        </div>
      </section>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: "#e5e7eb" }} />
          Normal
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: "#fecaca" }} />
          Do Not Disturb
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: "#bbf7d0" }} />
          Clean My Room
        </div>
      </div>

      <section className="floor-list">
        {floors.map((floor) => {
          const isExpanded = expandedFloors.includes(floor.number);
          const dndCount = floor.rooms.filter((room) => room.dnd).length;
          const cmrCount = floor.rooms.filter((room) => room.cmr).length;

          return (
            <div className="floor-card" key={floor.number}>
              <button
                className="floor-header"
                onClick={() => toggleFloor(floor.number)}
                aria-expanded={isExpanded}
              >
                <span className="floor-title">
                  Floor {floor.number} · {floor.rooms.length} rooms
                </span>

                <span className="floor-counts">
                  <span className="count-pill count-dnd">
                    DND: {dndCount}
                  </span>
                  <span className="count-pill count-cmr">
                    CMR: {cmrCount}
                  </span>
                  <span>{isExpanded ? "−" : "+"}</span>
                </span>
              </button>

              {isExpanded && (
                <div className="room-grid">
                  {floor.rooms.map((room) => (
                    <div
                      className={roomColor(room)}
                      key={room.id}
                      title={room.requests
                        .map((request) => request.title || request.category_code)
                        .join(", ")}
                    >
                      <span className="room-number">
                        {room.room_number}
                      </span>

                      <div className="room-labels">
                        {room.dnd && (
                          <span className="room-label">DND</span>
                        )}
                        {room.cmr && (
                          <span className="room-label">CMR</span>
                        )}
                        {!room.dnd && !room.cmr && (
                          <span className="room-label">NORMAL</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
