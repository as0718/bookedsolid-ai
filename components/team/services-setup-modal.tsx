"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors, Sparkles, Palette, User, Loader2, Plus } from "lucide-react";

interface ServicesSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Common services for salon/barber businesses
const AVAILABLE_SERVICES = [
  { id: "haircut", name: "Haircut", icon: Scissors },
  { id: "mens-cut", name: "Men's Cut", icon: User },
  { id: "coloring", name: "Hair Coloring", icon: Palette },
  { id: "styling", name: "Styling", icon: Sparkles },
  { id: "beard-trim", name: "Beard Trim", icon: Scissors },
  { id: "blowout", name: "Blowout", icon: Sparkles },
  { id: "highlights", name: "Highlights", icon: Palette },
  { id: "balayage", name: "Balayage", icon: Palette },
  { id: "perm", name: "Perm", icon: Sparkles },
  { id: "extensions", name: "Extensions", icon: Sparkles },
  { id: "treatment", name: "Treatment", icon: Sparkles },
  { id: "updo", name: "Updo", icon: Sparkles },
];

export function ServicesSetupModal({ open, onOpenChange }: ServicesSetupModalProps) {
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customServices, setCustomServices] = useState<string[]>([]);
  const [customServiceInput, setCustomServiceInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleAddCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (trimmed && !customServices.includes(trimmed)) {
      setCustomServices((prev) => [...prev, trimmed]);
      setCustomServiceInput("");
    }
  };

  const removeCustomService = (service: string) => {
    setCustomServices((prev) => prev.filter((s) => s !== service));
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0 && customServices.length === 0) {
      setError("Please select at least one service you offer");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/team/setup-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          services: selectedServices,
          customServices: customServices,
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        router.refresh(); // Refresh to update user data
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save services");
      }
    } catch (err) {
      setError("Failed to save services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to the Team!</DialogTitle>
          <DialogDescription className="text-base">
            Let's get you set up. Select the services you offer so we can assign appointments to you.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_SERVICES.map((service) => {
              const Icon = service.icon;
              const isSelected = selectedServices.includes(service.id);

              return (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Checkbox
                    id={service.id}
                    checked={isSelected}
                    onCheckedChange={() => toggleService(service.id)}
                    className="pointer-events-none"
                  />
                  <Icon className={`h-5 w-5 ${isSelected ? "text-purple-600" : "text-gray-500"}`} />
                  <label
                    htmlFor={service.id}
                    className={`flex-1 cursor-pointer font-medium ${
                      isSelected ? "text-purple-900" : "text-gray-700"
                    }`}
                  >
                    {service.name}
                  </label>
                </div>
              );
            })}

            {/* Custom Service Option */}
            <div
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                showCustomInput
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Checkbox
                id="custom-service"
                checked={showCustomInput}
                onCheckedChange={() => setShowCustomInput(!showCustomInput)}
                className="pointer-events-none"
              />
              <Plus className={`h-5 w-5 ${showCustomInput ? "text-purple-600" : "text-gray-500"}`} />
              <label
                htmlFor="custom-service"
                className={`flex-1 cursor-pointer font-medium ${
                  showCustomInput ? "text-purple-900" : "text-gray-700"
                }`}
              >
                Other (Custom Service)
              </label>
            </div>
          </div>

          {/* Custom Service Input Section */}
          {showCustomInput && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <Label htmlFor="custom-service-input" className="text-sm font-medium text-gray-700 mb-2">
                Add Custom Service
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="custom-service-input"
                  type="text"
                  placeholder="Enter custom service name..."
                  value={customServiceInput}
                  onChange={(e) => setCustomServiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomService();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddCustomService}
                  disabled={!customServiceInput.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Display Added Custom Services */}
              {customServices.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Your Custom Services:</p>
                  <div className="flex flex-wrap gap-2">
                    {customServices.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white border border-purple-300 rounded-lg px-3 py-1.5"
                      >
                        <span className="text-sm font-medium text-purple-900">{service}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomService(service)}
                          className="text-purple-600 hover:text-purple-800 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || (selectedServices.length === 0 && customServices.length === 0)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                `Complete Setup (${selectedServices.length + customServices.length} selected)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
