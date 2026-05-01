import sideADeaths from "@assets/interface_SIDEA_deaths_icon.png";
import sideAHeart from "@assets/interface_SIDEA_heart.png";
import sideBDeaths from "@assets/interface_SIDEB_deaths_icon.png";
import sideBHeart from "@assets/interface_SIDEB_heart.png";
import sideCDeaths from "@assets/interface_SIDEC_deaths_icon.png";
import sideCHeart from "@assets/interface_SIDEC_heart.png";

import logo1 from "@assets/level_1_logo_prologue.png";
import logo2 from "@assets/level_2_logo_forsakencity.png";
import logo3 from "@assets/level_3_logo_oldsite.png";
import logo4 from "@assets/level_4_logo_celestialresort.png";
import logo5 from "@assets/level_5_logo_goldenridge.png";
import logo6 from "@assets/level_6_logo_mirrortemple.png";
import logo7 from "@assets/level_7_logo_reflection.png";
import logo8 from "@assets/level_8_logo_summit.png";
import logo9 from "@assets/level_9_logo_epilogue.png";
import logo10 from "@assets/level_10_logo_core.png";
import logo11 from "@assets/level_11_logo_farewell_both_front_back.png";

export const Assets_Vanilla_DeathIcons: Record<string, any> = {
	"SIDE A": sideADeaths,
	"SIDE B": sideBDeaths,
	"SIDE C": sideCDeaths,
};

const Assets_Vanilla_SideIcon: Record<string, any> = {
	"SIDE A": sideAHeart,
	"SIDE B": sideBHeart,
	"SIDE C": sideCHeart,
};

const Assets_Vanilla_ChapterIcon: Record<string, any> = {
	Prologue: logo1,
	"Forsaken City": logo2,
	"Old Site": logo3,
	"Celestial Resort": logo4,
	"Golden Ridge": logo5,
	"Mirror Temple": logo6,
	Reflection: logo7,
	"The Summit": logo8,
	Epilogue: logo9,
	Core: logo10,
	Farewell: logo11,
};
