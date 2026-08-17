const choices=["rock","paper","scissors"];
const icons={rock:"✊",paper:"✋",scissors:"✌️"};
let playerScore=0,computerScore=0;

const playerScoreEl=document.getElementById("playerScore");
const computerScoreEl=document.getElementById("computerScore");
const message=document.getElementById("message");
const playerMove=document.getElementById("playerMove");
const computerMove=document.getElementById("computerMove");

document.querySelectorAll(".choice").forEach(button=>{
 button.addEventListener("click",()=>playGame(button.dataset.choice));
});

function playGame(playerChoice){
 const computerChoice=choices[Math.floor(Math.random()*choices.length)];
 playerMove.textContent=icons[playerChoice];
 computerMove.textContent=icons[computerChoice];

 if(playerChoice===computerChoice){
   message.textContent="It's a draw! 🤝";
 }else if(
   (playerChoice==="rock"&&computerChoice==="scissors")||
   (playerChoice==="paper"&&computerChoice==="rock")||
   (playerChoice==="scissors"&&computerChoice==="paper")
 ){
   playerScore++;
   message.textContent="You win! 🎉";
 }else{
   computerScore++;
   message.textContent="Computer wins! 🤖";
 }
 playerScoreEl.textContent=playerScore;
 computerScoreEl.textContent=computerScore;
}

document.getElementById("resetBtn").addEventListener("click",()=>{
 playerScore=0;computerScore=0;
 playerScoreEl.textContent="0";computerScoreEl.textContent="0";
 playerMove.textContent="❔";computerMove.textContent="❔";
 message.textContent="Make your move!";
});