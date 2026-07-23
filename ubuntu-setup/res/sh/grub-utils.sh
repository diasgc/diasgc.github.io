#!/bin/bash

gcd() {
    local a=$1
    local b=$2
    while [[ $b -ne 0 ]]; do
        local t=$b
        b=$((a % b))
        a=$t
    done
    echo $a
}

displaymodes(){
  res=($(xrandr -q | awk '{print $1}' | grep -oP '\d+x\d+'))
  for a in "${res[@]}"; do
   b=($(echo $a | sed 's,x, ,g'))
   w=${b[0]}
   h=${b[1]}
   g=$(gcd $w $h)
   echo "${b[0]} x ${b[1]} [$((w/g)):$((h/g))]"
  done
}