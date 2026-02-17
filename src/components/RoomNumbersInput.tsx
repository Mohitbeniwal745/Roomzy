import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, XCircle } from "lucide-react";

type Mode = "manual" | "auto";

interface RoomNumbersInputProps {
  roomNumbers: string[];
  setRoomNumbers: React.Dispatch<React.SetStateAction<string[]>>;
}

const RoomNumbersInput = ({ roomNumbers, setRoomNumbers }: RoomNumbersInputProps) => {
  const [mode, setMode] = useState<Mode>("manual");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const generateFromRange = () => {
    const from = parseInt(rangeFrom);
    const to = parseInt(rangeTo);
    if (isNaN(from) || isNaN(to) || from > to) return;
    if (to - from + 1 > 500) return; // safety cap
    const generated = Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
    // Append to existing, deduplicating
    setRoomNumbers((prev) => {
      const existing = prev.filter((r) => r.trim() !== "");
      const merged = [...existing, ...generated.filter((g) => !existing.includes(g))];
      return merged.length > 0 ? merged : [""];
    });
  };

  const clearAllRooms = () => {
    setRoomNumbers([""]);
  };

  const validRoomCount = roomNumbers.filter((r) => r.trim() !== "").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Room Numbers {validRoomCount > 0 && <span className="text-muted-foreground font-normal">({validRoomCount} rooms)</span>}</Label>
        {validRoomCount > 0 && (
          <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={clearAllRooms}>
            <XCircle className="h-4 w-4 mr-1" /> Delete All Rooms
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("manual")}
        >
          Manual
        </Button>
        <Button
          type="button"
          variant={mode === "auto" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("auto")}
        >
          Auto (Range)
        </Button>
      </div>

      {mode === "manual" ? (
        <>
          <p className="text-xs text-muted-foreground">Enter each room number individually (e.g. 101, 102, 201)</p>
          <div className="space-y-2">
            {roomNumbers.map((rn, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={rn}
                  onChange={(e) => {
                    const updated = [...roomNumbers];
                    updated[i] = e.target.value;
                    setRoomNumbers(updated);
                  }}
                  placeholder={`Room ${i + 1}`}
                />
                {roomNumbers.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => setRoomNumbers((prev) => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setRoomNumbers((prev) => [...prev, ""])}>
              <Plus className="h-4 w-4 mr-1" /> Add Room
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Enter a range to add room numbers. New rooms will be appended to existing ones (duplicates are skipped).</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              placeholder="From (e.g. 101)"
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="number"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              placeholder="To (e.g. 110)"
              className="w-32"
            />
            <Button type="button" variant="secondary" size="sm" onClick={generateFromRange}>
              Generate
            </Button>
          </div>
          {roomNumbers.length > 0 && roomNumbers[0] !== "" && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">{validRoomCount} rooms total:</p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {roomNumbers.filter(r => r.trim()).map((rn) => (
                  <Badge key={rn} variant="secondary" className="text-xs">{rn}</Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RoomNumbersInput;
