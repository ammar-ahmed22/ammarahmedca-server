import * as React from "react";
import { Text, Heading, Button } from "@react-email/components";
import Starter from "./Starter";
import type { HalfMove, PieceType, Color } from "@ammar-ahmed22/chess-engine";

export type MovePlayedProps = React.JSX.IntrinsicAttributes & {
  playerName: string;
  playerEmail: string;
  movePlayed: HalfMove;
  gameLink: string;
};

export type PieceMap = {
  [K in Color]: {
    [J in PieceType]: string;
  };
};

const pieceMap: PieceMap = {
  white: {
    king: "\u{2654}",
    queen: "\u{2655}",
    rook: "\u{2656}",
    bishop: "\u{2657}",
    knight: "\u{2658}",
    pawn: "\u{2659}",
  },
  black: {
    king: "\u{265A}",
    queen: "\u{265B}",
    rook: "\u{265C}",
    bishop: "\u{265D}",
    knight: "\u{265E}",
    pawn: String.fromCharCode(0x265f),
  },
};

const MovePlayed: React.FC<MovePlayedProps> = ({
  playerName = "Tester",
  playerEmail = "tester@tester.com",
  movePlayed = {
    from: "e4",
    to: "e5",
    take: "pawn",
    color: "white",
    piece: "pawn",
  },
  gameLink = "https://google.ca",
}) => {
  const previewText = `${playerName} (${playerEmail}) played their move!`;
  return (
    <Starter previewText={previewText}>
      <Heading className="text-black text-[24px] text-center font-normal p-0 my-[30px] mx-0">
        <strong>It's your turn!</strong>
      </Heading>
      <Text className="text-black text-[16px] font-normal p-0 mx-0">
        <strong>
          {playerName} {"("}
          {playerEmail}
          {")"}
        </strong>
        , played their move. It's your turn to play now!
      </Text>
      <Text className="text-black text-[24px] font-normal p-0 mx-0 text-center">
        {!movePlayed.castle && (
          <>
            <strong>{movePlayed.from}</strong>
            <span style={{ fontFamily: "Arial Unicode MS" }}>
              {" "}
              ({pieceMap[movePlayed.color][movePlayed.piece]}){" "}
            </span>
            {movePlayed.take ? "⚔️" : "\u{2192}"}{" "}
            <strong>{movePlayed.to}</strong>
            {movePlayed.take && (
              <span style={{ fontFamily: "Arial Unicode MS" }}>
                {" "}
                (
                {
                  pieceMap[movePlayed.color === "white" ? "black" : "white"][
                    movePlayed.take
                  ]
                }
                )
              </span>
            )}
            {movePlayed.promotion && (
              <span style={{ fontFamily: "Arial Unicode MS" }}>
                {" "}
                ({pieceMap[movePlayed.color][movePlayed.promotion]})
              </span>
            )}
          </>
        )}
        {movePlayed.castle && (
          <>
            <span style={{ fontFamily: "Arial Unicode MS", fontSize: "32px" }}>
              {pieceMap[movePlayed.color]["rook"]}
            </span>
            <span style={{ fontFamily: "Arial Unicode MS", fontSize: "32px" }}>
              {pieceMap[movePlayed.color][movePlayed.piece]}
            </span>
            <strong>(castle {movePlayed.castle}side)</strong>
          </>
        )}
      </Text>
      <Button
        className="bg-black text-white w-full py-2 text-center rounded"
        href={gameLink}
      >
        Play your move
      </Button>
      <Text className="text-black text-[12px] font-light text-center p-0 mx-0">
        If you do not have an active chess game at ammarahmed.ca, you can safely
        disregard this message or contact me at ammar.ahmed2203@gmail.com.
      </Text>
    </Starter>
  );
};

export default MovePlayed;
