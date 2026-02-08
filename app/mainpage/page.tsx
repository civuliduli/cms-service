"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { format, parseISO } from "date-fns";

// TODO: Update specific service

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

export default function MainPage() {
  const [fullName, setFullName] = useState<string>("");
  const [deviceType, setDeviceType] = useState<string>("Mob");
  const [problem, setProblem] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [isReady, setIsReady] = useState<boolean>(false);
  const [parts, setParts] = useState<number>(0);
  const [partsOrigin, setPartsOrigin] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [searchWord, setSearchWord] = useState<string>("");
  const [openDialogRow, setOpenDialogRow] = useState<ServicesModel | null>(
    null,
  );
  const [services, setServices] = useState<ServicesModel[]>([]);

  // ADD THIS: Load QZ Tray via CDN
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/qz-tray@2.2.2/qz-tray.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  async function loadServices() {
    try {
      const { data, error } = await supabase.from("services").select("*");
      if (error) {
        console.error("Error fetching services:", error);
        setServices([]);
      } else {
        setServices(data as ServicesModel[]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      return [];
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  const filteredServices = services.filter((item) => {
    const query = searchWord.toLowerCase();
    return (
      item.fullName.toLowerCase().includes(query) ||
      item.deviceType.toLowerCase().includes(query) ||
      item.phoneNumber.toString().includes(query) ||
      item.problem.toLowerCase().includes(query)
    );
  });

  // Sort filteredServices by createdAt descending (newest first) for rendering and logging
  const sortedFilteredServices = [...filteredServices].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Log sortedFilteredServices only when it changes
  useEffect(() => {
    console.log("Filtered Results (newest first):", sortedFilteredServices);
  }, [sortedFilteredServices]);

  async function handleSubmit({
    fullName,
    deviceType,
    problem,
    phoneNumber,
    price,
  }: {
    fullName: string;
    deviceType: string;
    problem: string;
    phoneNumber: string;
    price: string;
  }) {
    try {
      // 1. Save to Supabase
      const { error } = await supabase
        .from("services")
        .insert([
          { fullName, deviceType, problem, phoneNumber, price, isReady: false },
        ]);

      if (error) throw error;
      await loadServices();

      alert("Service request submitted successfully!");

      try {
        if (!window.qz.websocket.isActive()) {
          await window.qz.websocket.connect();
        }

        const printerName = "Tysso Thermal Receipt Printer (Copy 1)";

        // Create ESC/POS commands for thermal receipt
        const receiptData = [
          "\x1B\x40", // Initialize printer
          "\x1B\x61\x01", // Center align
          "\x1B\x21\x30", // Double size
          "CMS\n",
          "\x1B\x21\x00", // Normal size
          "Computer & Mobile Service\n",
          "+389 70 402 386\n",
          `${format(new Date(), "dd-MMM-yy")}\t${format(new Date(), "HH:mm:ss")}`,
          "----------------------------- \n",
          "\x1B\x61\x00",
          `Emri/Ime: ${fullName}\n`,
          `${deviceType}: ${problem}\n`,
          "\n",
          "\n",
          `Tel: ${phoneNumber} \t Çmimi/Cena: ${price}\n`,
          "------------------------------------------------\n",
          "\x1B\x61\x01",
          "Për servisimin do informoheni me SMS\n",
          "Za servisot ke bidete izvesteni so SMS\n",
          "Ju Faleminderit \t Vi Blagodarime\n",
          "\x1D\x56\x00",
        ];

        const config = window.qz.configs.create(printerName);
        await window.qz.print(config, receiptData);

        alert("Receipt printed successfully!");
      } catch (error) {
        console.error("Printing error:", error);
        alert("Failed to print. Make sure QZ Tray is running.");
      } finally {
      }

      // 5. Clear Form
      setFullName("");
      setDeviceType("Mob");
      setProblem("");
      setPhoneNumber("");
      setPrice("");
    } catch (error) {
      console.error("Error submitting service request:", error);
      alert("Failed to submit service request.");
    }
  }

  return (
    <div>
      <div className="mt-4 mb-6">
        <label
          htmlFor="search"
          className="block text-sm font-medium text-gray-700"
        >
          Quick Search
        </label>
        <input
          type="text"
          placeholder="Search by name, phone, or device..."
          value={searchWord}
          onChange={(e) => {
            setSearchWord(e.target.value);
          }}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label
            htmlFor="fullName"
            className="block text-sm/6 font-medium text-black"
          >
            Full Name
          </label>
          <div className="mt-2">
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={fullName || ""}
              onChange={(e) => setFullName(e.target.value)} // Capture change
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-black outline-1 -outline-offset-1 outline-gray/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>

        <div className="sm:col-span-2 sm:col-start-1">
          <label
            htmlFor="deviceType"
            className="block text-sm/6 font-medium text-black"
          >
            Device Type
          </label>
          <div className="mt-2">
            <select
              id="deviceType"
              name="deviceType"
              value={deviceType} // Controlled component
              onChange={(e) => setDeviceType(e.target.value)}
              className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 py-1.5 pr-8 pl-3 text-base text-black outline-1 -outline-offset-1 outline-gray/10 *:bg-gray-800 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            >
              <option value="Mob">Mob</option>
              <option value="Tablet">Tablet</option>
              <option value="Laptop">Laptop</option>
              <option value="PC">PC</option>
            </select>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="city"
            className="block text-sm/6 font-medium text-black"
          >
            Problem
          </label>
          <div className="mt-2">
            <input
              id="problem"
              name="problem"
              type="text"
              value={problem || ""}
              onChange={(e) => setProblem(e.target.value)}
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-black outline-1 -outline-offset-1 outline-gray/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label
            htmlFor="last-name"
            className="block text-sm/6 font-medium text-black"
          >
            Mob
          </label>
          <div className="mt-2">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="text"
              value={phoneNumber || ""}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-black outline-1 -outline-offset-1 outline-gray/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>

        <div className="sm:col-span-3 sm:col-start-1">
          <label
            htmlFor="first-name"
            className="block text-sm/6 font-medium text-black"
          >
            Price
          </label>
          <div className="mt-2">
            <input
              id="price"
              name="price"
              type="number"
              value={price || ""}
              onChange={(e) => setPrice(e.target.value)}
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-black outline-1 -outline-offset-1 outline-gray/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>
        <div className="sm:col-span-3 sm:col-start-1">
          <button
            type="submit"
            className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            onClick={() =>
              handleSubmit({
                fullName,
                deviceType,
                problem,
                phoneNumber,
                price,
              })
            }
          >
            Save
          </button>
        </div>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        {/* First Table */}
        <div className="sm:col-span-3">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-auto max-h-[350px]">
              <div>
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="bg-gray-900 text-amber-50">
                        Date
                      </TableHead>
                      <TableHead className="bg-gray-900 text-amber-50">
                        FullName
                      </TableHead>
                      <TableHead className="bg-gray-900 text-amber-50">
                        DeviceType
                      </TableHead>
                      <TableHead className="bg-gray-900 text-amber-50">
                        Problem
                      </TableHead>
                      <TableHead className="bg-gray-900 text-amber-50">
                        Mob
                      </TableHead>
                      <TableHead className="bg-gray-900 text-amber-50">
                        Price
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFilteredServices.map((filteredService) => (
                      <TableRow
                        key={filteredService.id}
                        onDoubleClick={() => setOpenDialogRow(filteredService)}
                        className="cursor-pointer hover:bg-gray-800"
                      >
                        <TableCell>
                          {format(
                            parseISO(filteredService.createdAt),
                            "MMM dd, yyyy",
                          )}
                        </TableCell>
                        <TableCell>{filteredService.fullName}</TableCell>
                        <TableCell>{filteredService.deviceType}</TableCell>
                        <TableCell>{filteredService.problem}</TableCell>
                        <TableCell>{filteredService.phoneNumber}</TableCell>
                        <TableCell>{filteredService.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <AlertDialog
                  open={openDialogRow !== null}
                  onOpenChange={(open) => !open && setOpenDialogRow(null)}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogDescription>
                        {openDialogRow
                          ? `This will affect ${openDialogRow.fullName}'s service record.`
                          : ""}
                      </AlertDialogDescription>
                      <div className="sm:col-span-2 sm:col-start-1">
                        <div className="mt-2 flex gap-2">
                          <div className="w-full">
                            <label
                              htmlFor="part1"
                              className="block text-xs text-gray-600 mb-1"
                            >
                              Parts
                            </label>
                            <input
                              id="part1"
                              name="part1"
                              type="number"
                              value={price || ""}
                              onChange={(e) => setPrice(e.target.value)}
                              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-black outline-1 -outline-offset-1 outline-gray/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                            />
                          </div>

                          <div className="w-full">
                            <label
                              htmlFor="part2"
                              className="block text-xs text-gray-600 mb-1"
                            >
                              Parts Origin
                            </label>
                            <select
                              id="deviceType"
                              name="deviceType"
                              value={deviceType} // Controlled component
                              onChange={(e) => setDeviceType(e.target.value)}
                              className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 py-1.5 pr-8 pl-3 text-base text-black outline-1 -outline-offset-1 outline-gray/10 *:bg-gray-800 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                            >
                              <option value="Mob">Mega</option>
                              <option value="Tablet">Akvarius</option>
                              <option value="Laptop">Qamo</option>
                              <option value="PC">Dugi</option>
                              <option value="PC">Bekim</option>
                              <option value="PC">Amaco</option>
                              <option value="PC">Arti</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-2 flex gap-2">
                          <div className="w-full">
                            <label
                              htmlFor="part3"
                              className="block text-xs text-gray-600 mb-1"
                            >
                              Is Ready
                            </label>
                            <select
                              id="deviceType"
                              name="deviceType"
                              value={deviceType} // Controlled component
                              onChange={(e) => setDeviceType(e.target.value)}
                              className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 py-1.5 pr-8 pl-3 text-base text-black outline-1 -outline-offset-1 outline-gray/10 *:bg-gray-800 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                            >
                              <option value="Mob">Yes</option>
                              <option value="Tablet">No</option>
                            </select>
                          </div>

                          <div className="w-full">
                            <label
                              htmlFor="part4"
                              className="block text-xs text-gray-600 mb-1"
                            >
                              User
                            </label>
                            <select
                              id="deviceType"
                              name="deviceType"
                              value={deviceType} // Controlled component
                              onChange={(e) => setDeviceType(e.target.value)}
                              className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 py-1.5 pr-8 pl-3 text-base text-black outline-1 -outline-offset-1 outline-gray/10 *:bg-gray-800 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                            >
                              <option value="Mob">Tani</option>
                              <option value="Tablet">Duli</option>
                              <option value="Tablet">Jusuf</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setOpenDialogRow(null)}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>

        {/* Second Table */}
        <div className="sm:col-span-3">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-auto max-h-[350px]">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-900 z-10">
                  <TableRow>
                    <TableHead className="bg-gray-900 text-amber-50">
                      Date
                    </TableHead>
                    <TableHead className="bg-gray-900 text-amber-50">
                      FullName
                    </TableHead>
                    <TableHead className="bg-gray-900 text-amber-50">
                      DeviceType
                    </TableHead>
                    <TableHead className="bg-gray-900 text-amber-50">
                      Problem
                    </TableHead>
                    <TableHead className="bg-gray-900 text-amber-50">
                      Mob
                    </TableHead>
                    <TableHead className="bg-gray-900 text-amber-50">
                      Price
                    </TableHead>
                    <TableHead className="bg-gray-900 text-amber-50">
                      User
                    </TableHead>
                    <TableHead className="bg-gray-900 text-amber-50">
                      Parts
                    </TableHead>
                    <TableHead className="bg-gray-900 text-amber-50">
                      Parts Origin
                    </TableHead>
                    <TableHead className="bg-gray-900 text-amber-50">
                      Ready
                    </TableHead>
                  </TableRow>
                </TableHeader>
                {/* <TableBody>
                  {services.map((service) => (
                    <TableRow
                      key={service.id}
                      onClick={() =>
                        console.log("Row clicked:", service.fullName)
                      }
                      className="cursor-pointer hover:bg-gray-800"
                    >
                      <TableCell>
                        {format(parseISO(service.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{service.fullName}</TableCell>
                      <TableCell>{service.deviceType}</TableCell>
                      <TableCell>{service.problem}</TableCell>
                      <TableCell>{service.phoneNumber}</TableCell>
                      <TableCell>{service.price}</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Parts</TableCell>
                      <TableCell>Parts Origin</TableCell>
                      <TableCell>IsReady</TableCell>
                    </TableRow>
                  ))}
                </TableBody> */}
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
