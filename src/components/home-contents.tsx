
import { MockAnalytics } from "./Cards/MockAnalytics";
import { Chats } from "./Cards/Chats";
import { MockPieChart } from "./Cards/MockPieChart";
import { LeftSideMenu } from "./left-side-menu";
import ProfileComponent from "./ui/ProfileComponent";
import HomeTopMenu from "./ui/HomeTopMenu";
import { IdeasCard } from "./Cards/IdeasCard";

export function HomeContents() {
  return (
    <div className="flex h-screen overflow-hidden">
      <LeftSideMenu />
      
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Bar with Menus */}
        <div className="flex justify-between items-center pt-3 pb-3 z-20 border-b border-background mr-10 ml-5">
          <div className="flex-1 flex justify-center">
            <HomeTopMenu />
          </div>
          <div className="flex-shrink-0">
            <ProfileComponent />
          </div>
        </div>
        
        {/* Main Content Area - Grid Layout */}
        <div className="flex-1 pl-4 pr-8 py-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-4 gap-6">
            {/* First Row */}
            <div className="col-span-2">
              <Chats />
            </div>
            <IdeasCard />
            <MockPieChart />
            
            {/* Second Row */}
            <MockAnalytics />
            <MockPieChart />
            <MockPieChart />
            <MockAnalytics />
          </div>
        </div>
      </div>
    </div>
  );
}
