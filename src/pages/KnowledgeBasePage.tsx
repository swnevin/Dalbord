
import Sidebar from "../components/Sidebar";
import { KnowledgeBase } from "@/components/KnowledgeBase";

const KnowledgeBasePage = () => {
  return (
    <div className="flex h-screen bg-cream">
      <Sidebar role="client" />
      <div className="flex-1">
        <KnowledgeBase />
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
