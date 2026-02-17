import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

const DEFAULT_AMENITIES = [
  "WiFi", "Kitchen", "Parking", "Pool", "Air Conditioning", "Heating",
  "Washer", "Dryer", "TV", "Gym", "Hot Tub", "Pets Allowed",
];

interface AmenitiesInputProps {
  amenities: string[];
  setAmenities: React.Dispatch<React.SetStateAction<string[]>>;
}

const AmenitiesInput = ({ amenities, setAmenities }: AmenitiesInputProps) => {
  const [customAmenity, setCustomAmenity] = useState("");

  const toggleAmenity = (a: string) => {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed || amenities.includes(trimmed)) return;
    setAmenities((prev) => [...prev, trimmed]);
    setCustomAmenity("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomAmenity();
    }
  };

  // Custom amenities are those not in the default list
  const customAmenities = amenities.filter((a) => !DEFAULT_AMENITIES.includes(a));

  return (
    <div className="space-y-3">
      <Label>Amenities</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {DEFAULT_AMENITIES.map((a) => (
          <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} />
            {a}
          </label>
        ))}
      </div>

      {customAmenities.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Custom amenities:</p>
          <div className="flex flex-wrap gap-1.5">
            {customAmenities.map((a) => (
              <Badge key={a} variant="secondary" className="gap-1 text-xs">
                {a}
                <button type="button" onClick={() => toggleAmenity(a)} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={customAmenity}
          onChange={(e) => setCustomAmenity(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add custom amenity..."
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addCustomAmenity} disabled={!customAmenity.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
};

export default AmenitiesInput;
