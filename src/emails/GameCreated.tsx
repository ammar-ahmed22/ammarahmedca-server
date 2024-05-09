import * as React from "react";
import Starter from "./Starter";
import { Heading, Text } from "@react-email/components"

export type GameCreatedProps = React.JSX.IntrinsicAttributes & {
  playerName: string,
  playerEmail: string
}

const GameCreated: React.FC<GameCreatedProps> = ({
  playerName = "Saniya",
  playerEmail = "saniya.ahmedd1@gmail.com"
}) => {
  const previewText = ""
  return (
    <Starter previewText={previewText}>
      <Heading className="text-black text-[24px] text-center font-normal p-0 my-[30px] mx-0">
        <strong>Game created</strong>
      </Heading>
      <Text className="text-black text-[16px] font-normal p-0 mx-0">
        <strong>{playerName} ({playerEmail})</strong> created a game.
      </Text>
    </Starter>
  )
}

export default GameCreated;