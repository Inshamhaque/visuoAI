export default function TextProperties() {
  const times = [
    { text: "Start time", val: 0 },
    { text: "End time", val: 0 },
    { text: "X Position", val: 200 },
    { text: "Y Position", val: 600 },
    { text: "Font Size", val: 200 },
    { text: "Z-index", val: 0 },
  ];

  return (
    <div className="flex flex-col gap-4 h-full max-h-full overflow-y-auto pr-2">
      <h1 className="text-lg font-semibold">Text Content</h1>

      <textarea
        defaultValue="Enter your content"
        className="w-full border p-2 rounded resize-none bg-transparent text-white"
      />

      <div className="flex flex-col gap-2">
        {times.map((item, i) => (
          <div key={i} className="flex flex-col">
            <label className="text-sm text-gray-300">{item.text}</label>
            <input
              type="number"
              defaultValue={item.val}
              className="border px-2 py-1 rounded bg-gray-900 text-white"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-sm text-gray-300">Font</label>
        <select
          defaultValue="Arial"
          className="w-full border px-2 py-1 rounded bg-gray-900 text-white"
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-300">Text Colour</label>
        <input
          type="color"
          className="w-full h-10 border rounded bg-transparent"
        />
      </div>
    </div>
  );
}
