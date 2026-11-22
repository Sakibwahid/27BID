import { Text } from "./Text";
export function Stats({ width, label }) {
    return (
      <div className={`w-full  mb-3` }>
        <div className="flex items-center justify-between text-fifa-text text-sm">
          <Text className="text-fifa-text text-lg">{label}</Text>
          <Text className="text-fifa-text text-lg">{width}</Text>
        </div>
        <div className="w-full h-[5px] bg-fifa-elevated rounded">
          <div className="h-full bg-fifa-accent rounded" style={{ width: `${width}%` }}></div>
        </div>
      </div>
    );
  }

  export default Stats;
  