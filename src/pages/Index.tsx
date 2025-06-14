
import TerminalHeader from "@/components/TerminalHeader";
import AgentChat from "@/components/AgentChat";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <TerminalHeader />
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <AgentChat />
        </div>
      </div>
    </div>
  );
};

export default Index;
